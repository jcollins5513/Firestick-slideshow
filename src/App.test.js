import "@testing-library/jest-dom";
import { render, screen } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  // Mock browser APIs used by three.js and react-use-measure
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  });

  // Mock PhotoSphereViewer
  window.PhotoSphereViewer = { Viewer: jest.fn(() => ({ destroy: jest.fn(), setPanorama: jest.fn() })) };
});

test('renders Firestick Slideshow heading', () => {
  render(<App />);
  const heading = screen.getByText(/Firestick Slideshow/i);
  expect(heading).toBeInTheDocument();
});
