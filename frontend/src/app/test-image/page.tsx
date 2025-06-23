import React from 'react';
import Image from 'next/image';

export default function TestImagePage() {
  const imagePath = '/images/placeholder-news.jpg';
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Image Path Test</h1>
      <p>Testing image path: {imagePath}</p>
      
      <div style={{ margin: '2rem 0', border: '1px solid #ccc', padding: '1rem' }}>
        <h2>Using HTML img tag:</h2>
        <img 
          src={imagePath} 
          alt="Test Image" 
          style={{ maxWidth: '100%', height: 'auto' }}
          onError={(e) => {
            console.error('Image failed to load:', imagePath);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      <div style={{ margin: '2rem 0', border: '1px solid #ccc', padding: '1rem' }}>
        <h2>Using Next.js Image component:</h2>
        <Image
          src={imagePath}
          alt="Test Image"
          width={300}
          height={200}
          onError={() => console.error('Next.js Image failed to load:', imagePath)}
        />
      </div>
      
      <div>
        <h2>Direct Links:</h2>
        <ul>
          <li>
            <a href={imagePath} target="_blank" rel="noopener noreferrer">
              Open image in new tab
            </a>
          </li>
          <li>
            <a href="/api/hello" target="_blank" rel="noopener noreferrer">
              Test API Route
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
