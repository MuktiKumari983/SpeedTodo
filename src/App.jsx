import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const CATEGORIES = ['Personal', 'Study', 'Work', 'Shopping', 'Health', 'General'];

export default function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('speed_tasks_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic user tracking initialization
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('speed_user_name') || 'Mukti Kumari';
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Study');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Tasks');
  const [editingTaskId, setEditingTaskId] = useState(null);

  // States to manage Platform Embed Playlists dynamically
  const [playlistUrl, setPlaylistUrl] = useState(() => {
    return localStorage.getItem('speed_playlist_url') || 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn';
  });
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    localStorage.setItem('speed_tasks_v2', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('speed_user_name', userName);
  }, [userName]);

  // Universal Dynamic Embed Transformer Engine
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    
    try {
      // 1. Spotify Handling (Tracks, Playlists, Albums)
      if (cleanUrl.includes('spotify.com')) {
        if (!cleanUrl.includes('/embed')) {
          return cleanUrl.replace('spotify.com/', 'spotify.com/embed/');
        }
        return cleanUrl;
      }
      
      // 2. YouTube & YouTube Music Handling
      if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
        if (cleanUrl.includes('list=')) {
          const listId = cleanUrl.split('list=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/videoseries?list=${listId}`;
        }
        if (cleanUrl.includes('v=')) {
          const videoId = cleanUrl.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        if (cleanUrl.includes('youtu.be/')) {
          const videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // 3. SoundCloud Handling
      if (cleanUrl.includes('soundcloud.com')) {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&color=%2310b981&auto_play=false&hide_related=true&show_comments=false`;
      }
    } catch (e) {
      console.error("Error formatting music url provider layout:", e);
    }
    
    return cleanUrl;
  };

  const handlePlaylistSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    
    const formattedUrl = getEmbedUrl(customInput);
    setPlaylistUrl(formattedUrl);
    localStorage.setItem('speed_playlist_url', formattedUrl);
    setCustomInput('');
    setShowInput(false);
  };

  const handleAddOrUpdateTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      setTasks(tasks.map(task => task.id === editingTaskId ? {
        ...task, title: title.trim(), description: description.trim(), dueDate, priority, category
      } : task));
      setEditingTaskId(null);
    } else {
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Pending',
        priority,
        category,
        isPinned: false,
        completedAt: null
      };
      setTasks([newTask, ...tasks]);
    }
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate || '');
    setPriority(task.priority);
    setCategory(task.category);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
  };

  const cycleStatus = (id, currentStatus) => {
    let nextStatus = 'Pending';
    if (currentStatus === 'Pending') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';

    setTasks(tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          status: nextStatus,
          completedAt: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null
        };
      }
      return task;
    }));
  };

  const togglePin = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, isPinned: !task.isPinned } : task));
  };

  const deleteTask = (id) => {
    if (editingTaskId === id) cancelEdit();
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getHeatmapData = () => {
    const counts = {};
    tasks.forEach(task => {
      if (task.status === 'Completed' && task.completedAt) {
        counts[task.completedAt] = (counts[task.completedAt] || 0) + 1;
      }
    });
    return Object.keys(counts).map(date => ({ date, count: counts[date] }));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'Completed') return task.status === 'Completed';
    if (activeFilter === 'In Progress') return task.status === 'In Progress';
    if (activeFilter === 'Due Today') return task.dueDate === todayStr;
    return true;
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const today = new Date();
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(today.getMonth() - 4);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return { emoji: '✨', style: 'bg-emerald-600 text-white' };
      case 'In Progress': return { emoji: '⏳', style: 'bg-teal-500 text-white' };
      default: return { emoji: '💤', style: 'bg-stone-200 text-stone-600' };
    }
  };

  return (
    <div className="min-h-screen text-stone-700 flex relative overflow-hidden selection:bg-emerald-100 w-full">
      
      {/* BRAND COLOR SCROLLBAR & HEATMAP OVERRIDES */}
      <style>{`
        * {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(16, 185, 129, 0.5) rgba(255, 255, 255, 0.05) !important;
        }
        ::-webkit-scrollbar, *::-webkit-scrollbar {
          width: 10px !important;
          height: 10px !important;
        }
        ::-webkit-scrollbar-track, *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        ::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5) !important;
          border-radius: 9999px !important;
          border: 2px solid transparent !important;
          background-clip: padding-box !important;
        }
        ::-webkit-scrollbar-thumb:hover, *::-webkit-scrollbar-thumb:hover {
          background: rgba(4, 120, 87, 0.8) !important;
        }
        /* FIXED: Added explicit borders & opacity controls to maintain complete contrast over Unsplash backgrounds */
        .react-calendar-heatmap .color-scale-1 { fill: #d1fae5 !important; opacity: 1 !important; stroke: rgba(4, 120, 87, 0.15) !important; }
        .react-calendar-heatmap .color-scale-2 { fill: #a7f3d0 !important; opacity: 1 !important; stroke: rgba(4, 120, 87, 0.2) !important; }
        .react-calendar-heatmap .color-scale-3 { fill: #34d399 !important; opacity: 1 !important; stroke: rgba(4, 120, 87, 0.25) !important; }
        .react-calendar-heatmap .color-scale-4 { fill: #059669 !important; opacity: 1 !important; stroke: rgba(4, 120, 87, 0.3) !important; }
        .react-calendar-heatmap .color-empty { fill: rgba(255, 255, 255, 0.4) !important; stroke: rgba(0, 0, 0, 0.08) !important; opacity: 1 !important; }
        .react-calendar-heatmap rect { rx: 4px; ry: 4px; }
      `}</style>
      
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2560&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
      </div>

      <div className="flex flex-1 relative z-10 w-full">
        
        {/* SIDE NAVIGATION */}
        <aside className="w-64 bg-white/20 backdrop-blur-2xl border-r border-white/30 p-6 flex flex-col justify-between hidden md:flex shrink-0">
          <div className="space-y-8">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xl">⚡</span>
              <span className="text-lg font-bold tracking-tight text-stone-800/90 font-serif italic">speedtodo</span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'All Tasks', label: 'My Day', icon: '🌸' },
                { id: 'In Progress', label: 'In Progress', icon: '🌸' },
                { id: 'Completed', label: 'Completed Log', icon: '🌸' },
                { id: 'Due Today', label: 'Due Deadlines', icon: '🌸' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveFilter(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    activeFilter === item.id 
                      ? 'bg-white/80 text-emerald-700 font-semibold shadow-sm border border-white/40' 
                      : 'text-stone-600/80 hover:bg-white/30'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* FIXED FLICKERING LOOP BY TYING EVENT FOCUS ON FULL WRAPPER AND DISABLING BUBBLE INTERRUPTIONS */}
          <div className="group bg-white/40 hover:bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/40 flex items-center gap-3 shadow-sm transition-all duration-300 cursor-default">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-xs pointer-events-none select-none">🌿</div>
            <div className="pointer-events-none select-none">
              <h4 className="text-xs font-bold text-stone-800/90">{userName} Workspace</h4>
              <p className="text-[10px] text-stone-500 font-medium">Cozy & Focused</p>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-900/90 tracking-tight">
                Good evening, {userName} 
              </h1>
              <p className="text-xs text-stone-500 font-medium mt-0.5">Streamlined tracking grids.</p>
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search targets..."
                className="w-full bg-white/50 backdrop-blur-xl border border-white/40 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-400 focus:bg-white/80 shadow-sm placeholder-stone-400"
              />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            <div className="lg:col-span-2 space-y-4">
              {/* CHECKLIST PANEL */}
              <div className="bg-white/40 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <h2 className="text-sm font-bold text-stone-800/90 flex items-center gap-2">
                    Today's Focus Checklist <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-emerald-700 font-bold">{filteredTasks.length}</span>
                  </h2>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredTasks.length === 0 ? (
                    <div className="py-16 border border-dashed border-white/40 rounded-2xl text-center text-xs text-stone-400 font-medium italic bg-white/10">
                      No matching targets recorded.
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const badge = getStatusBadge(task.status);
                      return (
                        <div 
                          key={task.id} 
                          className={`group p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 bg-white/50 border-white/20 hover:bg-white/80 ${
                            task.isPinned ? 'border-emerald-300 bg-emerald-50/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => cycleStatus(task.id, task.status)}
                              className={`w-6 h-6 rounded-xl border flex items-center justify-center text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-95 shrink-0 ${badge.style}`}
                            >
                              {badge.emoji}
                            </button>

                            <div className="space-y-0.5 min-w-0">
                              <h4 className={`text-sm font-semibold tracking-tight truncate ${task.status === 'Completed' ? 'line-through text-stone-400 font-normal opacity-60' : 'text-stone-800'}`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs truncate text-stone-500">{task.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-1 font-medium">
                                <span className="px-1.5 py-0.2 rounded bg-white/60 text-stone-600 font-semibold text-[9px]">{task.category}</span>
                                <span className="text-[9px] font-bold uppercase px-1 rounded bg-emerald-50 text-emerald-700">{task.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => togglePin(task.id)} className={`p-1 hover:bg-white/60 rounded-lg text-xs ${task.isPinned ? 'text-emerald-600' : 'text-stone-400'}`}>📌</button>
                            <button onClick={() => startEdit(task)} className="p-1 hover:bg-white/60 text-stone-400 hover:text-emerald-600 rounded-lg text-xs">✏️</button>
                            <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-white/60 text-stone-400 hover:text-red-500 rounded-lg text-xs">🗑️</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* HEATMAP AREA */}
              <div className="bg-white/40 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Consistency Chart Matrix</h3>
                <div className="bg-white/40 p-2 rounded-2xl border border-white/20">
                  <CalendarHeatmap
                    startDate={fourMonthsAgo}
                    endDate={today}
                    values={getHeatmapData()}
                    classForValue={(value) => {
                      if (!value || value.count === 0) return 'color-empty';
                      if (value.count === 1) return 'color-scale-1';
                      if (value.count === 2) return 'color-scale-2';
                      if (value.count === 3) return 'color-scale-3';
                      return 'color-scale-4';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TASK ACTION PANEL RIGHT CELL */}
            <div className="lg:col-span-1 space-y-4">
              <form onSubmit={handleAddOrUpdateTask} className="bg-white/40 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-white/10 pb-1.5 flex justify-between items-center">
                  <span>{editingTaskId ? '📝 Modify Settings' : '➕ Append Target Item'}</span>
                  {editingTaskId && (
                    <button 
                      type="button" 
                      onClick={cancelEdit} 
                      className="text-[10px] text-emerald-700 hover:underline bg-white/60 px-2 py-0.5 rounded-md font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </h3>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wide">Target Objective</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Review project parameters..."
                      className="w-full bg-white/40 border border-white/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400 focus:bg-white/80 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wide">Subtext Notes</label>
                    <textarea
                      rows="2"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contextual details..."
                      className="w-full bg-white/40 border border-white/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400 focus:bg-white/80 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wide">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-white/40 border border-white/30 rounded-xl px-2 py-1.5 text-[11px] text-stone-600 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wide">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white/40 border border-white/30 rounded-xl px-2 py-1.5 text-[11px] text-stone-600 focus:outline-none focus:border-emerald-400 font-medium"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-[11px] uppercase tracking-wider hover:opacity-90 active:scale-[0.99] mt-1"
                >
                  {editingTaskId ? 'Affirm Parameter Updates' : 'Push New Item Node'}
                </button>
              </form>

              {/* INTEGRATED PLAYLIST IFRAME HUB */}
              <div className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl border border-white/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-stone-800/90">Workspace Music</h4>
                    <p className="text-[10px] text-stone-400 mt-0.5">Universal Platform Widget</p>
                  </div>
                  <button 
                    onClick={() => setShowInput(!showInput)}
                    className="text-[10px] font-semibold text-emerald-700 bg-white/80 border border-white/40 px-2.5 py-1 rounded-xl hover:bg-white shadow-xs transition-all"
                  >
                    🛠️ Change Playlist
                  </button>
                </div>

                {showInput && (
                  <form onSubmit={handlePlaylistSubmit} className="space-y-2 border-t border-white/20 pt-2">
                    <input 
                      type="url"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Paste Spotify, YouTube, or SoundCloud URL..."
                      className="w-full bg-white/50 border border-white/30 rounded-xl px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-emerald-500 placeholder-stone-400"
                      required
                    />
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-1.5 rounded-xl text-[10px] uppercase tracking-wider hover:bg-emerald-700 transition-all">
                      Load Platform Stream
                    </button>
                  </form>
                )}

                <div className="rounded-2xl overflow-hidden shadow-xs border border-white/20 bg-black/5">
                  <iframe 
                    src={playlistUrl} 
                    className="w-full h-[152px]" 
                    frameBorder="0" 
                    allowFullScreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    title="User Session Soundtrack Playlist"
                  ></iframe>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}