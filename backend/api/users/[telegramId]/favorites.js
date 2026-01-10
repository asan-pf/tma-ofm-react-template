import { supabase } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { telegramId } = req.query;

  if (req.method === 'GET') {
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

      // Get user's favorite locations with location details
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          locations (
            id,
            user_id,
            name,
            description,
            latitude,
            longitude,
            category,
            is_approved,
            created_at
          )
        `)
        .eq('user_id', userData.id);

      if (error) throw error;

      // Transform the data to flatten the location information
      const favoriteLocations = data.map(fav => ({
        ...fav.locations,
        favorite_id: fav.id,
        favorited_at: fav.created_at
      }));

      res.status(200).json(favoriteLocations);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { locationId } = req.body;

      if (!locationId) {
        return res.status(400).json({ error: 'Location ID is required' });
      }

      // Get user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add to favorites
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userData.id, location_id: locationId }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(409).json({ error: 'Location already in favorites' });
        }
        throw error;
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
