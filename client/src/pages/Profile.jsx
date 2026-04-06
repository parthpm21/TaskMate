import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isOwn = me?._id === id;

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/reviews/user/${id}`),
    ]).then(([userRes, reviewsRes]) => {
      setProfile(userRes.data.user);
      setReviews(reviewsRes.data.reviews);
      setEditForm({
        name: userRes.data.user.name,
        bio: userRes.data.user.bio,
        skills: userRes.data.user.skills?.join(', '),
      });
    }).catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        ...editForm,
        skills: editForm.skills?.split(',').map(s => s.trim()).filter(Boolean),
      });
      setProfile(data.user);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="pt-24 flex justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return <div className="pt-24 text-center text-[#555]">Profile not found</div>;

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Profile card */}
        <div className="bg-[#161616] border border-[#222] rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent font-extrabold text-3xl font-head">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <input
                    className="bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white font-head font-bold text-xl focus:outline-none focus:border-accent"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                ) : (
                  <h1 className="font-head font-extrabold text-2xl">{profile.name}</h1>
                )}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-[#555]">
                    {profile.rating > 0 ? `⭐ ${profile.rating.toFixed(1)} (${profile.totalReviews} reviews)` : 'No reviews yet'}
                  </span>
                  {profile.isVerified && <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">✓ Verified</span>}
                </div>
              </div>
            </div>
            {isOwn && !editing && (
              <button onClick={() => setEditing(true)} className="border border-[#222] text-[#888] hover:border-accent hover:text-accent transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                Edit Profile
              </button>
            )}
          </div>

          {/* Bio */}
          <div className="mt-6">
            {editing ? (
              <textarea
                rows={3} placeholder="Tell others about yourself..."
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent resize-none"
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              />
            ) : (
              <p className="text-[#777] text-sm leading-relaxed">
                {profile.bio || (isOwn ? 'Add a bio to let others know about you.' : 'No bio yet.')}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="mt-5">
            <div className="text-xs font-bold text-[#555] uppercase tracking-wider mb-3">Skills</div>
            {editing ? (
              <input
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent"
                placeholder="React, Design, Delivery, Cooking (comma separated)"
                value={editForm.skills}
                onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))}
              />
            ) : profile.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span key={skill} className="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="text-[#444] text-sm">{isOwn ? 'Add your skills.' : 'No skills listed.'}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#1e1e1e]">
            {[['Tasks Posted', profile.tasksPosted], ['Tasks Done', profile.tasksDone], ['Total Earned', `₹${(profile.totalEarned || 0).toLocaleString('en-IN')}`]].map(([label, val]) => (
              <div key={label} className="text-center">
                <div className="font-head font-extrabold text-xl text-accent">{val}</div>
                <div className="text-xs text-[#555] mt-1">{label}</div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="flex gap-3 mt-6">
              <button onClick={saveProfile} disabled={saving} className="flex-1 bg-accent text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="px-6 border border-[#222] rounded-xl text-[#666] hover:border-accent hover:text-accent transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="font-head font-bold text-xl mb-5">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-[#161616] border border-[#222] rounded-2xl">
              <div className="text-3xl mb-3">⭐</div>
              <p className="text-[#555] text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="bg-[#161616] border border-[#222] rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                        {review.reviewer?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{review.reviewer?.name}</div>
                        <div className="text-xs text-[#555]">{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</div>
                      </div>
                    </div>
                    <div className="text-accent font-bold">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                  </div>
                  {review.comment && <p className="text-[#777] text-sm mt-3 leading-relaxed">{review.comment}</p>}
                  {review.task && <p className="text-xs text-[#444] mt-2">Task: {review.task.title}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
