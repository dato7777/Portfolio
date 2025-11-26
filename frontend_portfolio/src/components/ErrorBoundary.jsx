import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    // Optional: send to logger
    console.error("MiniGlobe error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-cyan-400/30 bg-white/5 backdrop-blur p-4 text-sm">
          <p className="text-red-300 font-semibold">Globe failed to render.</p>
          <p className="opacity-80">Your browser may not support WebGL, or a 3D dependency crashed.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
