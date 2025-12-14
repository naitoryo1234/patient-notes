'use server';

import { SYSTEM_SETTINGS_KEYS, updateSystemSetting } from '@/services/systemSettingService';
import { revalidatePath } from 'next/cache';

export async function toggleAttachmentPluginAction(enabled: boolean) {
    try {
        await updateSystemSetting(
            SYSTEM_SETTINGS_KEYS.PLUGIN_ATTACHMENTS_ENABLED,
            enabled,
            'Enable/Disable Image Attachment Plugin'
        );
        revalidatePath('/'); // Revalidate everywhere as this affects global layout
        return { success: true };
    } catch (error) {
        console.error('Failed to toggle attachment plugin:', error);
        return { success: false, error: 'Failed to update setting' };
    }
}
