import React, { useRef, useState } from "react";

const is360Image = (file) => {
  // Heuristic: filename contains '360' or 'pano', or user marks it
  return /360|pano/i.test(file.name);
};

const isVideo = (file) => {
  return file.type.startsWith("video/");
};

const isImage = (file) => {
  return file.type.startsWith("image/");
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
  const [newGroupName, setNewGroupName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Persist groups
  React.useEffect(() => {
    localStorage.setItem('slideshowGroups', JSON.stringify(groups));
  }, [groups]);

  // Helper: get current group
  const currentGroup = groups[selectedGroupIdx] || { name: '', media: [] };



  // Add files to current group
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
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
  };

  // Add a new group
  const addGroup = () => {
    if (!newGroupName.trim()) return;
    setGroups((prev) => [...prev, { name: newGroupName.trim(), media: [] }]);
    setSelectedGroupIdx(groups.length);
    setNewGroupName("");
    setCurrentIdx(0);
  };

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


  const next = () => {
    if (!currentGroup.media.length) return;
    setCurrentIdx((idx) => (idx + 1) % currentGroup.media.length);
  };

  const prev = () => {
    if (!currentGroup.media.length) return;
    setCurrentIdx((idx) => (idx - 1 + currentGroup.media.length) % currentGroup.media.length);
  };


  React.useEffect(() => {
    if (!playing || !currentGroup.media.length) return;
    slideshowTimer.current = setTimeout(() => {
      next();
    }, 5000);
    return () => clearTimeout(slideshowTimer.current);
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
      const url = URL.createObjectURL(file);
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
      return () => URL.revokeObjectURL(url);
    }
  }, [currentIdx, currentGroup.media]);

  const renderMedia = () => {
    if (!currentGroup.media.length) return <div style={{color:'#888'}}>No media in this group</div>;
    const file = currentGroup.media[currentIdx];
    if (is360Image(file)) {
      return <div ref={viewerRef} style={{ width: "100%", height: "60vh" }} />;
    }
    if (isVideo(file)) {
      return (
        <video
          src={URL.createObjectURL(file)}
          controls
          autoPlay={playing}
          style={{ width: "100%", height: "60vh", objectFit: "contain" }}
        />
      );
    }
    if (isImage(file)) {
      return (
        <img
          src={URL.createObjectURL(file)}
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
    <div className="app-container">
      <h1>Firestick Slideshow</h1>
      {/* Group selection and management */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedGroupIdx}
          onChange={e => selectGroup(Number(e.target.value))}
          style={{ fontSize: 18, padding: 4 }}
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
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ marginBottom: 20 }}
        disabled={groups.length === 0}
      />
      <div className="media-viewer">{renderMedia()}</div>
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
          </>
        )}
      </div>
      <div style={{marginTop:24, color:'#aaa', fontSize:15}}>
        Use remote arrows or keyboard (←/→, space) for navigation.
      </div>
    </div>
  );
}

export default App;
