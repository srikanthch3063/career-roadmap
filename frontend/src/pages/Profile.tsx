import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, Save, User, Mail, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { branches } from '../quizConfig';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      setEmail(user.email || '');
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setName(data?.name || user.user_metadata?.full_name || '');
      setBranch(data?.branch || '');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('name required');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('not auth');
      const { error } = await supabase.from('profiles').update({ name: name.trim(), branch }).eq('id', user.id);
      if (error) throw error;
      // also update auth metadata for consistency
      await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      toast.success('profile updated');
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="lumen-workbench" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><div className="lumen-loader" /></div>;

  return (
    <div className="lumen-workbench">
      <aside className="lumen-sidebar">
        <div className="lumen-sidebar__brand" onClick={() => navigate('/dashboard')}>
          <User size={18} /><span className="wordmark">profile</span>
        </div>
        <nav className="lumen-sidebar__nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}><ArrowLeft size={16}/><span>back to console</span></button>
        </nav>
      </aside>
      <main className="lumen-main document-main">
        <header className="document-header">
          <span className="eyebrow">01 · IDENTITY</span>
          <h1 className="document-title">edit profile.</h1>
          <p className="text-muted" style={{ fontFamily:'var(--font-mono)' }}>changes reflect in dashboard + future roadmaps</p>
        </header>
        <section className="document-section" style={{ maxWidth: 560 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div className="form-group">
              <label className="eyebrow"><Mail size={12} style={{ display:'inline', marginRight:6 }}/>email (read-only)</label>
              <input className="input" value={email} disabled style={{ opacity:0.6 }} data-testid="email-display" />
            </div>
            <div className="form-group">
              <label className="eyebrow" htmlFor="name"><User size={12} style={{ display:'inline', marginRight:6 }}/>full name</label>
              <input id="name" data-testid="name-input" className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="your name" />
            </div>
            <div className="form-group">
              <label className="eyebrow" htmlFor="branch"><Layers size={12} style={{ display:'inline', marginRight:6 }}/>branch</label>
              <select id="branch" data-testid="branch-select" className="input" value={branch} onChange={e=>setBranch(e.target.value)}>
                <option value="">select branch</option>
                {branches.map(b=> <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <button className="btn btn--primary" onClick={handleSave} disabled={saving} data-testid="save-profile">
              <Save size={16} style={{ marginRight:6 }}/> {saving ? 'saving...' : 'save changes'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
export default Profile;
