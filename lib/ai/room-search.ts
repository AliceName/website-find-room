import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";
import { getGeminiModelCandidates } from "@/lib/gemini/server";

/** Cap catalog size sent to Gemini when inventory is large. */
const MAX_ROOMS_FOR_AI = 50;

const ROOM_SELECT = `
  post_id,
  post_title,
  post_created_at,
  view_count,
  rooms:room_id (
    room_id,
    room_description,
    room_price,
    room_area,
    room_status,
    is_hidden,
    full_address,
    address_detail,
    latitude,
    longitude,
    vr_url,
    room_types:room_type_id (
      room_type_id,
      room_type_name
    ),
    roomimages (
      image_url,
      is_360
    ),
    locations:location_id (
      location_id,
      city,
      district,
      ward
    ),
    roomamenities (
      amenity_id,
      amenities (
        amenity_id,
        amenity_name
      )
    )
  )
`;

export type SearchablePost = {
  post_id: string;
  post_title: string;
  post_created_at: string | null;
  view_count: number | null;
  rooms: {
    room_id: string;
    room_description: string | null;
    room_price: number;
    room_area: number | null;
    room_status: boolean | null;
    is_hidden?: boolean | null;
    full_address: string | null;
    address_detail: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    vr_url: string | null;
    room_types: { room_type_id: string; room_type_name: string } | null;
    roomimages: { image_url: string; is_360: boolean | null }[];
    locations: {
      location_id: string;
      city: string;
      district: string;
      ward: string;
    } | null;
    roomamenities: {
      amenity_id: string;
      amenities: { amenity_id: string; amenity_name: string } | null;
    }[];
  } | null;
};

export type RoomSearchMatch = SearchablePost & { matchReason: string };

export type CompactRoom = {
  room_id: string;
  post_id: string;
  title: string;
  price_vnd: number;
  area_m2: number | null;
  type: string | null;
  city: string | null;
  district: string | null;
  ward: string | null;
  address: string | null;
  description: string;
  amenities: string[];
  available: boolean;
};

type AiMatchPayload = {
  matches?: { room_id: string; reason?: string }[];
  summary?: string;
};

function truncate(text: string | null | undefined, max = 280): string {
  if (!text) return "";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function toCompactRoom(post: SearchablePost): CompactRoom | null {
  const room = post.rooms;
  if (!room?.room_id) return null;

  const loc = room.locations;
  const address =
    room.full_address ||
    room.address_detail ||
    [loc?.ward, loc?.district, loc?.city].filter(Boolean).join(", ") ||
    null;

  return {
    room_id: room.room_id,
    post_id: post.post_id,
    title: post.post_title,
    price_vnd: room.room_price,
    area_m2: room.room_area,
    type: room.room_types?.room_type_name ?? null,
    city: loc?.city ?? null,
    district: loc?.district ?? null,
    ward: loc?.ward ?? null,
    address,
    description: truncate(room.room_description),
    amenities: (room.roomamenities ?? [])
      .map((ra) => ra.amenities?.amenity_name)
      .filter((n): n is string => Boolean(n)),
    available: room.room_status !== false,
  };
}

export async function fetchSearchablePosts(): Promise<SearchablePost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(ROOM_SELECT)
    .order("post_created_at", { ascending: false })
    .limit(MAX_ROOMS_FOR_AI * 2);

  if (error) {
    throw new Error(`Không tải được danh sách phòng: ${error.message}`);
  }

  const posts = (data ?? []) as unknown as SearchablePost[];

  return posts
    .filter(
      (p) =>
        p.rooms &&
        p.rooms.is_hidden !== true &&
        p.rooms.room_status !== false &&
        p.rooms.room_id,
    )
    .slice(0, MAX_ROOMS_FOR_AI);
}

function parseAiJson(text: string): AiMatchPayload {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(stripped) as AiMatchPayload;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON không hợp lệ");
  }
  return parsed;
}

const SYSTEM_INSTRUCTION = `Bạn là trợ lý tìm phòng trọ tại Việt Nam.
Người dùng mô tả nhu cầu bằng tiếng Việt; bạn nhận danh sách phòng dạng JSON.
Chỉ trả về JSON hợp lệ (không markdown), đúng schema:
{
  "matches": [ { "room_id": "<id>", "reason": "<lý do ngắn tiếng Việt>" } ],
  "summary": "<tóm tắt ngắn hoặc gợi ý nếu không có phòng phù hợp>"
}
Xếp matches theo độ phù hợp (phù hợp nhất trước). Tối đa 10 phòng. Chỉ dùng room_id có trong danh sách.`;

export async function rankRoomsWithGemini(
  apiKey: string,
  userQuery: string,
  posts: SearchablePost[],
): Promise<{ matches: RoomSearchMatch[]; aiSummary?: string }> {
  const compact = posts
    .map(toCompactRoom)
    .filter((r): r is CompactRoom => r !== null);

  if (compact.length === 0) {
    return { matches: [] };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `Yêu cầu người dùng:\n${userQuery}\n\nDanh sách phòng (${compact.length}):\n${JSON.stringify(compact)}`;

  let lastError: unknown;
  for (const modelName of getGeminiModelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (!text) {
        throw new Error("Gemini không trả về nội dung.");
      }

      let payload: AiMatchPayload;
      try {
        payload = parseAiJson(text);
      } catch {
        throw new Error("Không phân tích được kết quả AI.");
      }

      const byRoomId = new Map(
        posts.filter((p) => p.rooms?.room_id).map((p) => [p.rooms!.room_id, p]),
      );

      const matches: RoomSearchMatch[] = [];
      for (const item of payload.matches ?? []) {
        if (!item?.room_id || matches.length >= 10) continue;
        const post = byRoomId.get(item.room_id);
        if (!post) continue;
        matches.push({
          ...post,
          matchReason: item.reason?.trim() || "Phù hợp với yêu cầu của bạn.",
        });
      }

      return {
        matches,
        aiSummary: payload.summary?.trim() || undefined,
      };
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Lỗi Gemini API không xác định.");
}

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

type ChatAiPayload = {
  reply?: string;
  rooms?: { room_id: string; matchReason?: string; reason?: string }[];
};

const CHAT_SYSTEM_PREFIX = `Bạn là trợ lý thân thiện tìm phòng trọ của ứng dụng Find Room, trả lời bằng tiếng Việt.
Bạn có danh sách phòng hiện có (JSON bên dưới). Qua hội thoại, hãy hỏi hoặc ghi nhận tiêu chí (khu vực, giá, diện tích, tiện ích…).
Khi đã đủ thông tin HOẶC người dùng muốn xem gợi ý / tìm phòng, hãy đề xuất tối đa 6 phòng CHỈ từ danh sách (không bịa phòng, không dùng room_id ngoài danh sách).
Luôn trả về JSON hợp lệ (không markdown bọc ngoài), đúng schema:
{
  "reply": "<nội dung trả lời người dùng, có thể dùng xuống dòng>",
  "rooms": [ { "room_id": "<id>", "matchReason": "<lý do ngắn tiếng Việt>" } ]
}
"rooms" có thể là mảng rỗng khi chỉ trò chuyện hoặc cần thêm thông tin.
Nếu thiếu thông tin, hãy đặt câu hỏi ngắn gọn thay vì đoán bừa.

Danh sách phòng:
`;

function buildChatSystemInstruction(compact: CompactRoom[]): string {
  return `${CHAT_SYSTEM_PREFIX}${JSON.stringify(compact)}`;
}

function mapChatRoomsToMatches(
  posts: SearchablePost[],
  items: ChatAiPayload["rooms"],
): RoomSearchMatch[] {
  const byRoomId = new Map(
    posts.filter((p) => p.rooms?.room_id).map((p) => [p.rooms!.room_id, p]),
  );

  const matches: RoomSearchMatch[] = [];
  for (const item of items ?? []) {
    if (!item?.room_id || matches.length >= 6) continue;
    const post = byRoomId.get(item.room_id);
    if (!post) continue;
    const reason =
      item.matchReason?.trim() ||
      item.reason?.trim() ||
      "Phù hợp với yêu cầu của bạn.";
    matches.push({ ...post, matchReason: reason });
  }
  return matches;
}

function formatChatTranscript(messages: ChatMessageInput[]): string {
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "Trợ lý" : "Người dùng";
      return `${speaker}: ${message.content.trim()}`;
    })
    .join("\n");
}

export async function chatRoomAssistantWithGemini(
  apiKey: string,
  messages: ChatMessageInput[],
  posts: SearchablePost[],
): Promise<{ reply: string; rooms: RoomSearchMatch[] }> {
  const compact = posts
    .map(toCompactRoom)
    .filter((r): r is CompactRoom => r !== null);

  const genAI = new GoogleGenerativeAI(apiKey);

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    throw new Error("Tin nhắn cuối phải từ người dùng.");
  }

  const transcript = formatChatTranscript(messages.slice(0, -1));
  const prompt = [
    transcript ? `Lịch sử hội thoại:\n${transcript}` : "Lịch sử hội thoại: (trống)",
    `Tin nhắn mới của người dùng:\n${last.content.trim()}`,
    `\nHãy trả lời đúng JSON theo schema đã quy định.`,
  ].join("\n");

  let lastError: unknown;
  for (const modelName of getGeminiModelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildChatSystemInstruction(compact),
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.35,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (!text) {
        throw new Error("Gemini không trả về nội dung.");
      }

      let payload: ChatAiPayload;
      try {
        payload = parseAiJson(text) as ChatAiPayload;
      } catch {
        throw new Error("Không phân tích được kết quả AI.");
      }

      const reply =
        payload.reply?.trim() ||
        "Xin lỗi, tôi chưa hiểu rõ. Bạn mô tả thêm khu vực và mức giá nhé?";

      return {
        reply,
        rooms: mapChatRoomsToMatches(posts, payload.rooms),
      };
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Lỗi Gemini API không xác định.");
}
