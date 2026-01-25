import { createClient } from '@supabase/supabase-js';
import Logger from '../lib/logger';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const storageService = {
    async uploadFile(bucketName: string, path: string, file: Buffer, contentType: string) {
        if (!supabase) {
            Logger.error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
            throw new Error('Storage service unavailable');
        }

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(path, file, {
                contentType,
                upsert: true
            });

        if (error) {
            Logger.error('Error uploading file to Supabase:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(path);

        return publicUrl;
    }
};
