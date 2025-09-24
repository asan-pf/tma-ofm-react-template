import { supabase } from '../../../../lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { telegramId, locationId } = req.query;

  if (req.method === 'DELETE') {
    try {
      // Get user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove from favorites
      const { data, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userData.id)
        .eq('location_id', locationId)
        .select();

      if (error) throw error;

      if (data.length === 0) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      res.status(200).json({ message: 'Favorite removed successfully' });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
