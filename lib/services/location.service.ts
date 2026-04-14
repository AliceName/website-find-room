import { supabase } from '../supabaseClient';

export interface Location {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    created_at?: string;
    updated_at?: string;
}

export class LocationService {
    // Lấy tất cả địa điểm
    static async getAllLocations(): Promise<Location[]> {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .order('name');

        if (error) {
            throw new Error(`Lỗi khi lấy danh sách địa điểm: ${error.message}`);
        }

        return data || [];
    }

    // Lấy địa điểm theo ID
    static async getLocationById(id: string): Promise<Location | null> {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Không tìm thấy
            }
            throw new Error(`Lỗi khi lấy địa điểm: ${error.message}`);
        }

        return data;
    }

    // Tạo địa điểm mới
    static async createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
        const { data, error } = await supabase
            .from('locations')
            .insert(location)
            .select()
            .single();

        if (error) {
            throw new Error(`Lỗi khi tạo địa điểm: ${error.message}`);
        }

        return data;
    }

    // Cập nhật địa điểm
    static async updateLocation(id: string, updates: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>): Promise<Location> {
        const { data, error } = await supabase
            .from('locations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Lỗi khi cập nhật địa điểm: ${error.message}`);
        }

        return data;
    }

    // Xóa địa điểm
    static async deleteLocation(id: string): Promise<void> {
        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Lỗi khi xóa địa điểm: ${error.message}`);
        }
    }

    // Tìm kiếm địa điểm theo tên
    static async searchLocations(query: string): Promise<Location[]> {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('name');

        if (error) {
            throw new Error(`Lỗi khi tìm kiếm địa điểm: ${error.message}`);
        }

        return data || [];
    }

    // Lấy địa điểm trong bán kính (sử dụng PostGIS hoặc tính toán đơn giản)
    static async getLocationsNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<any[]> {
        const { data, error } = await supabase
            .rpc('get_locations_within_distance', {
                lat: latitude,
                lng: longitude,
                radius_km: radiusKm
            });

        if (error) {
            throw new Error(`Lỗi khi lấy địa điểm gần đó: ${error.message}`);
        }

        return data || [];
    }
}