import React, { useRef, useState } from "react";
import { ReactComponent as BentleyLogo } from "./assets/bentley-logo.svg";
import BillboardScene from "./BillboardScene";

const getExtType = (url) => {
  if (/\.(mp4|webm|mov|m4v|hevc)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|gif|bmp|heic|heif|avif)$/i.test(url)) return 'image';
  return '';
};

const is360Image = (file) => {
  const name = file && (file.name || file.url);
  return name && /360|pano/i.test(name);
};

const isVideo = (file) => {
  if (!file) return false;
  if (file.type) return file.type.startsWith('video/');
  if (file.url) return getExtType(file.url) === 'video';
  if (file.name) return /\.(mp4|webm|mov|m4v|hevc)$/i.test(file.name);
  return false;
};

const isImage = (file) => {
  if (!file) return false;
  if (file.type) return file.type.startsWith('image/');
  if (file.url) return getExtType(file.url) === 'image';
  if (file.name) return /\.(jpg|jpeg|png|gif|bmp|heic|heif|avif)$/i.test(file.name);
  return false;
};

function App() {
  // Groups: [{ name: string, media: [File, ...] }]
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('slideshowGroups');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [psv, setPsv] = useState(null);
  const slideshowTimer = useRef(null);
  const viewerRef = useRef();
  const videoRef = useRef();
  const [newGroupName, setNewGroupName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Load inventory from the API on startup
  React.useEffect(() => {
    fetch('/inventory')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          const media = data.map(item => ({
            name: item.name || item.url,
            url: item.url,
            type: item.type
          }));
          setGroups(prev => [{ name: 'Inventory', media }, ...prev]);
        }
      })
      .catch(err => console.error('Failed to load inventory', err));
  }, []);

  // Persist groups
  React.useEffect(() => {
    localStorage.setItem('slideshowGroups', JSON.stringify(groups));
  }, [groups]);

  // Helper: get current group
  const currentGroup = groups[selectedGroupIdx] || { name: '', media: [] };



  // Add files to current group
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map(f => {
      f.userMarked360 = false;
      return f;
    });
    if (!files.length) return;
    setGroups((prev) => {
      const updated = [...prev];
      if (!updated[selectedGroupIdx]) return updated;
      updated[selectedGroupIdx] = {
        ...updated[selectedGroupIdx],
        media: [...updated[selectedGroupIdx].media, ...files],
      };
      return updated;
    });
    setCurrentIdx(0);
    setPlaying(false);
    if (psv) {
      psv.destroy();
      setPsv(null);
    }
    // Reset input so selecting the same file triggers onChange again
    e.target.value = "";
  };

  // Add a new group
  const addGroup = () => {
    if (!newGroupName.trim()) return;
    setGroups((prev) => [...prev, { name: newGroupName.trim(), media: [] }]);
    setSelectedGroupIdx(groups.length);
    setNewGroupName("");
    setCurrentIdx(0);
  };

  // Keep selectedGroupIdx in bounds if groups change
  React.useEffect(() => {
    if (selectedGroupIdx >= groups.length && groups.length > 0) {
      setSelectedGroupIdx(groups.length - 1);
      setCurrentIdx(0);
    }
  }, [groups, selectedGroupIdx]);

  // Select group
  const selectGroup = (idx) => {
    setSelectedGroupIdx(idx);
    setCurrentIdx(0);
    setPlaying(false);
    if (psv) {
      psv.destroy();
      setPsv(null);
    }
  };

  // Delete group
  const deleteGroup = (idx) => {
    if (!window.confirm('Delete this group?')) return;
    setGroups((prev) => prev.filter((_, i) => i !== idx));
    setSelectedGroupIdx(0);
    setCurrentIdx(0);
    setPlaying(false);
    if (psv) {
      psv.destroy();
      setPsv(null);
    }
  };

  // Rename group
  const startRename = () => {
    setRenaming(true);
    setRenameValue(currentGroup.name);
  };
  const confirmRename = () => {
    setGroups((prev) => {
      const updated = [...prev];
      updated[selectedGroupIdx] = {
        ...updated[selectedGroupIdx],
        name: renameValue.trim(),
      };
      return updated;
    });
    setRenaming(false);
  };

  const toggleCurrentMark360 = () => {
    setGroups((prev) => {
      const updated = [...prev];
      const group = { ...updated[selectedGroupIdx] };
      const media = [...group.media];
      if (!media[currentIdx]) return prev;
      media[currentIdx].userMarked360 = !media[currentIdx].userMarked360;
      group.media = media;
      updated[selectedGroupIdx] = group;
      return updated;
    });
    if (psv) {
      psv.destroy();
      setPsv(null);
    }
  };
  
  const loadInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const items = await res.json();
      const files = await Promise.all(
        items.map(async (item) => {
          const r = await fetch(item.url);
          const blob = await r.blob();
          return new File([blob], item.name, { type: item.type });
        })
      );
      setGroups((prev) => [...prev, { name: 'Inventory', media: files }]);
      setSelectedGroupIdx(groups.length);
    } catch (err) {
      console.error(err);
      alert('Failed to load inventory');
    }
  };


  const next = () => {
    if (!currentGroup.media.length) return;
    setCurrentIdx((idx) => (idx + 1) % currentGroup.media.length);
  };

  const prev = () => {
    if (!currentGroup.media.length) return;
    setCurrentIdx((idx) => (idx - 1 + currentGroup.media.length) % currentGroup.media.length);
  };


  // Slideshow logic: timer for images, wait for video end for videos
  React.useEffect(() => {
    if (!playing || !currentGroup.media.length) return;
    const file = currentGroup.media[currentIdx];
    if (isVideo(file)) {
      // For videos, advance on 'ended' event
      if (videoRef.current) {
        const handler = () => {
          if (playing) next();
        };
        videoRef.current.addEventListener('ended', handler);
        return () => {
          if (videoRef.current) videoRef.current.removeEventListener('ended', handler);
        };
      }
    } else {
      // For images/360s, advance after 5s
      slideshowTimer.current = setTimeout(() => {
        next();
      }, 5000);
      return () => clearTimeout(slideshowTimer.current);
    }
  }, [playing, currentIdx, currentGroup.media]);

  React.useEffect(() => {
    // Clean up PSV if not 360
    if (psv && (!currentGroup.media[currentIdx] || !is360Image(currentGroup.media[currentIdx]))) {
      psv.destroy();
      setPsv(null);
    }
    // If 360 image, show it
    if (
      currentGroup.media[currentIdx] &&
      is360Image(currentGroup.media[currentIdx]) &&
      viewerRef.current
    ) {
      const file = currentGroup.media[currentIdx];
      const url = file.url || URL.createObjectURL(file);
      if (psv) {
        psv.setPanorama(url);
      } else {
        setPsv(
          new window.PhotoSphereViewer.Viewer({
            container: viewerRef.current,
            panorama: url,
            navbar: false,
            loadingImg: null,
            defaultYaw: 0,
          })
        );
      }
      return () => {
        if (!file.url) URL.revokeObjectURL(url);
      };
    }
  }, [currentIdx, currentGroup.media]);

  const renderMedia = () => {
    if (!currentGroup.media.length) return <div style={{color:'#888'}}>No media in this group</div>;
    const file = currentGroup.media[currentIdx];
    if (!file) return <div style={{color:'#888'}}>No media selected</div>;
    if (is360Image(file)) {
      return <div ref={viewerRef} style={{ width: "200%", height: "100vh" }} />;
    }
    if (isVideo(file)) {
      const src = file.url || URL.createObjectURL(file);
      return (
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay={playing}
          style={{ width: "100%", height: "60vh", objectFit: "contain" }}
        />
      );
    }
    if (isImage(file)) {
      const src = file.url || URL.createObjectURL(file);
      return (
        <img
          src={src}
          alt={file.name}
          style={{ width: "100%", height: "60vh", objectFit: "contain" }}
        />
      );
    }
    return <div>Unsupported file type</div>;
  };


  // Keyboard/remote navigation
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") setPlaying((p) => !p);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <BentleyLogo className="bentley-logo-overlay" />
      <div className="app-container">
        <h1>Firestick Slideshow</h1>
      {/* Group selection and management */}
      <div style={{ marginBottom: 15, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedGroupIdx}
          onChange={e => selectGroup(Number(e.target.value))}
          style={{ fontSize: 16, padding: 2 }}
        >
          {groups.map((g, idx) => (
            <option key={idx} value={idx}>{g.name}</option>
          ))}
        </select>
        <button onClick={startRename} disabled={!groups.length}>Rename</button>
        <button onClick={() => deleteGroup(selectedGroupIdx)} disabled={groups.length === 0}>Delete</button>
        <input
          type="text"
          placeholder="New group name"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          style={{ fontSize: 16, padding: 4 }}
        />
        <button onClick={addGroup}>Add Group</button>
        <button onClick={loadInventory}>Load Inventory</button>
      </div>
      {/* Rename dialog */}
      {renaming && (
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            style={{ fontSize: 16, padding: 4 }}
          />
          <button onClick={confirmRename}>OK</button>
          <button onClick={() => setRenaming(false)}>Cancel</button>
        </div>
      )}
      {/* Add media to group */}
      {groups.length === 0 ? (
        <div style={{ color: '#bbb', marginBottom: 20 }}>
          Create a group to enable media upload.
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'inline-block',
            padding: '0.6rem 1.2rem',
            background: '#333',
            color: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '1.1rem',
            marginRight: 10,
          }}>
            + Add Media
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
      <div className="media-viewer">
        <BillboardScene media={currentGroup.media[currentIdx]} />
      </div>
      <div className="controls">
        <button onClick={prev} disabled={currentGroup.media.length === 0}>
          ⏮ Prev
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          disabled={currentGroup.media.length === 0}
        >
          {playing ? "⏸ Pause" : "▶️ Play"}
        </button>
        <button onClick={next} disabled={currentGroup.media.length === 0}>
          Next ⏭
        </button>
      </div>
      <div style={{ fontSize: 18, marginTop: 10 }}>
        {currentGroup.media.length > 0 && (
          <>
            {currentIdx + 1} / {currentGroup.media.length} : {currentGroup.media[currentIdx].name}
            <label style={{ marginLeft: 10 }}>
              <input
                type="checkbox"
                checked={!!currentGroup.media[currentIdx].userMarked360}
                onChange={toggleCurrentMark360}
                style={{ marginRight: 4 }}
              />
              360°
            </label>
          </>
        )}
      </div>
      <div style={{marginTop:24, color:'#aaa', fontSize:15}}>
        Use remote arrows or keyboard (←/→, space) for navigation.
      </div>
    </div>
    </>
  );
}

export default App;
