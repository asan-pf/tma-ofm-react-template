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
        .from('comments')
        .select(`
          *,
          users (
            id,
            nickname,
            avatar_url
          )
        `)
        .eq('location_id', location_id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { location_id, user_id, content } = req.body;
      
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          location_id,
          user_id: user_id || null,
          content,
          is_approved: true
        }])
        .select(`
          *,
          users (
            id,
            nickname,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
