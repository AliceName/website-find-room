import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flag, Gavel, MapPin, ScrollText, ShieldCheck, Waves } from "lucide-react";
import SovereigntyMap from "@/components/map/SovereigntyMap";

type LegalPoint = {
  title: string;
  body: string;
};

type SovereigntyPageData = {
  title: string;
  shortName: string;
  breadcrumbProvince: string;
  parent: string;
  coords: string;
  seaArea: string;
  mapLabel: string;
  officialImageSrc: string;
  slug: "hoang-sa" | "truong-sa";
};

const LEGAL_POINTS: LegalPoint[] = [
  {
    title: "Cơ sở lịch sử",
    body: "Nhà nước Việt Nam đã xác lập, quản lý và thực thi chủ quyền đối với Hoàng Sa, Trường Sa một cách hòa bình, liên tục qua nhiều thời kỳ lịch sử.",
  },
  {
    title: "Bản đồ và tư liệu quốc tế",
    body: "Nhiều bản đồ, thư tịch và tài liệu hàng hải lịch sử ghi nhận hai quần đảo trong không gian quản lý của Việt Nam, không thuộc lãnh thổ Trung Quốc.",
  },
  {
    title: "Thời kỳ Pháp thuộc",
    body: "Chính quyền Pháp, với tư cách đại diện cho Việt Nam trong quan hệ đối ngoại, tiếp tục quản lý hành chính, khảo sát và bảo vệ hai quần đảo.",
  },
  {
    title: "Hội nghị San Francisco",
    body: "Tại Hội nghị San Francisco năm 1951, tuyên bố chủ quyền của Việt Nam đối với Hoàng Sa và Trường Sa không bị hội nghị phản đối.",
  },
  {
    title: "UNCLOS và luật biển hiện đại",
    body: "Việt Nam khẳng định quyền và lợi ích hợp pháp trên Biển Đông theo Công ước Liên Hợp Quốc về Luật Biển 1982 và luật pháp quốc tế.",
  },
  {
    title: "Bác bỏ đường lưỡi bò",
    body: "Phán quyết ngày 12/7/2016 của Tòa Trọng tài theo Phụ lục VII UNCLOS kết luận yêu sách đường lưỡi bò không có cơ sở pháp lý.",
  },
];

const PAGES: Record<string, SovereigntyPageData> = {
  "hoang-sa": {
    slug: "hoang-sa",
    title: "Phòng trọ, nhà ở tại Huyện Đảo Hoàng Sa, TP Đà Nẵng",
    shortName: "Huyện Đảo Hoàng Sa",
    breadcrumbProvince: "TP Đà Nẵng",
    parent: "Thuộc TP Đà Nẵng, Việt Nam",
    coords: "16.667873, 112.729937",
    seaArea: "~30.000 km²",
    mapLabel: "Quần đảo Hoàng Sa - Chủ quyền Việt Nam",
    officialImageSrc: "/sovereignty/vnsdi-hoang-sa.png",
  },
  "truong-sa": {
    slug: "truong-sa",
    title: "Phòng trọ, nhà ở tại Huyện Đảo Trường Sa, Tỉnh Khánh Hòa",
    shortName: "Huyện Đảo Trường Sa",
    breadcrumbProvince: "Tỉnh Khánh Hòa",
    parent: "Thuộc Tỉnh Khánh Hòa, Việt Nam",
    coords: "10.732475, 115.802980",
    seaArea: "~160.000 km²",
    mapLabel: "Quần đảo Trường Sa - Chủ quyền Việt Nam",
    officialImageSrc: "/sovereignty/vnsdi-truong-sa.png",
  },
};

export function generateStaticParams() {
  return [{ slug: "hoang-sa" }, { slug: "truong-sa" }];
}

export default async function SovereigntyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 md:px-8">
      <div className="mx-auto max-w-[1700px]">
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link href="/" className="text-slate-700 hover:text-blue-700">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/rooms" className="text-slate-700 hover:text-blue-700">
            {page.breadcrumbProvince}
          </Link>
          <span>/</span>
          <span className="text-slate-950">{page.shortName}</span>
        </nav>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
              <ShieldCheck className="h-4 w-4" />
              Chủ quyền Việt Nam
            </p>
            <h1 className="max-w-5xl text-2xl font-black tracking-normal text-slate-950 md:text-4xl">
              {page.title}
            </h1>
          </div>
          <Link
            href="/rooms"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về {page.breadcrumbProvince}
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 h-24 w-64 overflow-hidden rounded-md bg-[#da251d] shadow-xl shadow-red-900/20">
              <div className="relative h-full w-full">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.18),transparent_40%)]" />
                <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 bg-[#ffdf00] [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" />
              </div>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-normal text-slate-950">
              Hoàng Sa - Trường Sa
            </h2>
            <p className="mt-2 text-lg font-black uppercase tracking-widest text-red-600">
              Là của Việt Nam
            </p>
            <p className="mt-6 text-base font-semibold leading-8 text-slate-600">
              {page.shortName} là một phần lãnh thổ thiêng liêng, không thể tách rời của Việt Nam.
              Trang này dùng hình ảnh chi tiết và bản đồ tương tác từ VNSDI để thể hiện thông tin chủ quyền.
            </p>

            <div className="mt-7 grid gap-3">
              <InfoRow icon={<Flag className="h-6 w-6" />} title={page.shortName} value={page.parent} />
              <InfoRow icon={<MapPin className="h-6 w-6" />} title="Tọa độ tham chiếu" value={page.coords} />
              <InfoRow icon={<Waves className="h-6 w-6" />} title="Diện tích vùng biển" value={page.seaArea} />
            </div>
          </section>

          <section className="min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <SovereigntyMap slug={page.slug} archipelagoName={page.mapLabel} imageSrc={page.officialImageSrc} />
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <ScrollText className="h-7 w-7 text-red-600" />
            <h2 className="text-2xl font-black text-slate-950">Cơ sở lịch sử và pháp lý</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {LEGAL_POINTS.map((point) => (
              <article key={point.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                  <Gavel className="h-5 w-5 text-red-600" />
                  {point.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 md:px-8">
            <h2 className="text-2xl font-black text-slate-950">
              Bản đồ đầy đủ Việt Nam từ VNSDI
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Hình ảnh toàn cảnh được lấy từ bản đồ hành chính tại vnsdi.mae.gov.vn/bandohanhchinh.
            </p>
          </div>
          <img
            src="/sovereignty/vnsdi-vietnam-full.png"
            alt="Bản đồ hành chính đầy đủ Việt Nam từ VNSDI"
            className="w-full bg-slate-100"
          />
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="grid grid-cols-[32px_1fr] items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-left">
      <div className="text-red-500">{icon}</div>
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-bold text-slate-500">{value}</p>
      </div>
    </div>
  );
}
