import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS - allow frontend origins
  const allowedOrigins = [
    'https://openfreemap-frontend.vercel.app',
    'https://tma-ofm-react-template.vercel.app',
    'https://ofm-staging-frontend-git-master-ashharamirs-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
          type: 'permanent',
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
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
