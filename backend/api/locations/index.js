import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ensureModerator = async (userId) => {
    if (!userId) {
      return { status: 400, message: 'Missing moderator userId' };
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError) {
      return { status: 500, message: 'Failed to verify user role', details: userError };
    }

    if (user.role !== 'mod') {
      return { status: 403, message: 'Only moderators can perform this action' };
    }

    return { status: 200 };
  };

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        latitude,
        longitude,
        category,
        userId,
        websiteUrl,
        imageUrl,
        schedules,
      } = req.body;

      if (userId) {
        const { count: existingCount, error: existingCountError } = await supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (existingCountError) throw existingCountError;
        if ((existingCount ?? 0) > 0) {
          return res.status(409).json({ error: 'User has already created a location' });
        }
      }
      
      const { data, error } = await supabase
        .from('locations')
        .insert([{
          name,
          description,
          latitude,
          longitude,
          category,
          user_id: userId,
          is_approved: false,
          website_url: websiteUrl ?? null,
          image_url: imageUrl ?? null,
          schedules: schedules ?? null
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const { userId } = req.body ?? {};

      if (!id) {
        return res.status(400).json({ error: 'Missing location id' });
      }

      const moderatorCheck = await ensureModerator(userId);
      if (moderatorCheck.status !== 200) {
        if (moderatorCheck.details) {
          console.error('Moderator check failed:', moderatorCheck.details);
        }
        return res.status(moderatorCheck.status).json({ error: moderatorCheck.message });
      }

      const locationId = Number(id);
      if (Number.isNaN(locationId)) {
        return res.status(400).json({ error: 'Invalid location id' });
      }

      const { data: location, error: fetchError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', locationId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Location not found' });
        }
        throw fetchError;
      }

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const cleanupTables = ['comments', 'ratings', 'favorites'];
      for (const table of cleanupTables) {
        const { error: cleanupError } = await supabase
          .from(table)
          .delete()
          .eq('location_id', locationId);

        if (cleanupError) {
          throw cleanupError;
        }
      }

      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
