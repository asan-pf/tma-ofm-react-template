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
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const { userId } = req.body ?? {};

      if (!id) {
        return res.status(400).json({ error: 'Missing comment id' });
      }

      const moderatorCheck = await ensureModerator(userId);
      if (moderatorCheck.status !== 200) {
        if (moderatorCheck.details) {
          console.error('Moderator check failed:', moderatorCheck.details);
        }
        return res.status(moderatorCheck.status).json({ error: moderatorCheck.message });
      }

      const commentId = Number(id);
      if (Number.isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment id' });
      }

      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Comment not found' });
        }
        throw fetchError;
      }

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
