import { supabase } from '../supabaseClient';

export interface Room {
    id: string;
    title: string;
    description: string;
    price: number;
    location_id: string;
    user_id: string;
    amenities: string[]; // Mảng ID tiện ích
    images: string[]; // Mảng URL hình ảnh
    available_from: string;
    available_to?: string;
    max_occupants: number;
    created_at?: string;
    updated_at?: string;
}

export class RoomService {
    // Lấy tất cả phòng
    static async getAllRooms(): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Lỗi khi lấy danh sách phòng: ${error.message}`);
        }

        return data || [];
    }

    // Lấy phòng theo ID
    static async getRoomById(id: string): Promise<Room | null> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Không tìm thấy
            }
            throw new Error(`Lỗi khi lấy phòng: ${error.message}`);
        }

        return data;
    }

    // Lấy phòng theo user_id (phòng của người dùng)
    static async getRoomsByUser(userId: string): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Lỗi khi lấy phòng của người dùng: ${error.message}`);
        }

        return data || [];
    }

    // Tạo phòng mới
    static async createRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
        const { data, error } = await supabase
            .from('rooms')
            .insert(room)
            .select()
            .single();

        if (error) {
            throw new Error(`Lỗi khi tạo phòng: ${error.message}`);
        }

        return data;
    }

    // Cập nhật phòng
    static async updateRoom(id: string, updates: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>): Promise<Room> {
        const { data, error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Lỗi khi cập nhật phòng: ${error.message}`);
        }

        return data;
    }

    // Xóa phòng
    static async deleteRoom(id: string): Promise<void> {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Lỗi khi xóa phòng: ${error.message}`);
        }
    }

    // Tìm kiếm phòng theo tiêu đề hoặc mô tả
    static async searchRooms(query: string): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Lỗi khi tìm kiếm phòng: ${error.message}`);
        }

        return data || [];
    }

    // Lấy phòng theo vị trí
    static async getRoomsByLocation(locationId: string): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('location_id', locationId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Lỗi khi lấy phòng theo vị trí: ${error.message}`);
        }

        return data || [];
    }

    // Lấy phòng có sẵn trong khoảng thời gian
    static async getAvailableRooms(fromDate: string, toDate?: string): Promise<Room[]> {
        let query = supabase
            .from('rooms')
            .select('*')
            .lte('available_from', fromDate);

        if (toDate) {
            query = query.or(`available_to.is.null,available_to.gte.${toDate}`);
        } else {
            query = query.is('available_to', null);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Lỗi khi lấy phòng có sẵn: ${error.message}`);
        }

        return data || [];
    }

    // Lấy phòng theo khoảng giá
    static async getRoomsByPriceRange(minPrice: number, maxPrice: number): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .gte('price', minPrice)
            .lte('price', maxPrice)
            .order('price');

        if (error) {
            throw new Error(`Lỗi khi lấy phòng theo giá: ${error.message}`);
        }

        return data || [];
    }
}