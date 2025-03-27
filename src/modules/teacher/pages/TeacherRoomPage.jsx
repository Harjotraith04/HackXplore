import React, { useEffect } from 'react';

const StudentRoomPage = () => {
  
  useEffect(() => {
    const handleResize = () => {
      const iframe = document.getElementById('teacher-iframe');
      if (iframe) {
        iframe.style.height = `${window.innerHeight - 56}px`;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ position: 'relative', left: '0', right: '0', bottom: '0' }}>
      <iframe
        id="teacher-iframe"
        src="https://code-editor-frontend-one.vercel.app/"
        style={{ width: '100%', height: 'calc(100vh - 56px)', border: 'none', zIndex: '1' }}
        title="Interview Room"
      />
    </div>
  );
};

export default StudentRoomPage;