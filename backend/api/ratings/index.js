import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
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
      const { location_id } = req.query;
      
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('location_id', location_id);

      if (error) throw error;

      // Calculate average rating
      const average = data.length > 0 
        ? data.reduce((sum, rating) => sum + rating.stars, 0) / data.length 
        : 0;

      res.json({
        ratings: data,
        average: Math.round(average * 10) / 10,
        count: data.length
      });
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { location_id, user_id, stars } = req.body;
      
      // Upsert rating (update if exists, insert if not)
      const { data, error } = await supabase
        .from('ratings')
        .upsert(
          { location_id, user_id: user_id || null, stars },
          { onConflict: 'user_id,location_id' }
        )
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating/updating rating:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
