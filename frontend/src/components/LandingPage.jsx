import { useEffect, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import {
  Activity,
  Zap,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  ChevronDown,
  Star,
  Globe,
  Layers,
} from "lucide-react";

export default function LandingPage({ onGetStarted, onLogin }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  // ─── THREE.JS SCENE ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 50);

    sceneRef.current = { scene, camera, renderer };

    // ── PARTICLE FIELD ──
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const palette = [
      new THREE.Color("#6366f1"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#a78bfa"),
      new THREE.Color("#818cf8"),
      new THREE.Color("#c4b5fd"),
      new THREE.Color("#e0e7ff"),
    ];

    for (let i = 0; i < particleCount; i++) {
      const r = 80 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── FLOATING TORUS RINGS ──
    const rings = [];
    const torusConfigs = [
      { radius: 18, tube: 0.15, color: "#6366f1", x: -15, y: 8, z: -10, rx: 1.2, ry: 0.4 },
      { radius: 12, tube: 0.1,  color: "#8b5cf6", x: 20, y: -5, z: -5, rx: 0.8, ry: 1.1 },
      { radius: 22, tube: 0.12, color: "#a78bfa", x: 5, y: -12, z: -20, rx: 0.3, ry: 0.7 },
      { radius: 8,  tube: 0.08, color: "#c4b5fd", x: -25, y: -8, z: -8, rx: 1.5, ry: 0.2 },
    ];

    torusConfigs.forEach((cfg) => {
      const tGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 80);
      const tMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.4,
        wireframe: false,
      });
      const torus = new THREE.Mesh(tGeo, tMat);
      torus.position.set(cfg.x, cfg.y, cfg.z);
      torus.rotation.x = cfg.rx;
      torus.rotation.y = cfg.ry;
      torus.userData = { baseX: cfg.x, baseY: cfg.y, speed: 0.003 + Math.random() * 0.005 };
      scene.add(torus);
      rings.push(torus);
    });

    // ── ICOSAHEDRON CENTER ──
    const icoGeo = new THREE.IcosahedronGeometry(6, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: "#6366f1",
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(22, 5, -5);
    scene.add(ico);

    const icoSolid = new THREE.Mesh(
      new THREE.IcosahedronGeometry(5.8, 1),
      new THREE.MeshBasicMaterial({ color: "#1e1b4b", transparent: true, opacity: 0.6 })
    );
    icoSolid.position.set(22, 5, -5);
    scene.add(icoSolid);

    // ── FLOATING CUBES ──
    const cubes = [];
    for (let i = 0; i < 8; i++) {
      const size = 0.5 + Math.random() * 1.5;
      const cGeo = new THREE.BoxGeometry(size, size, size);
      const cMat = new THREE.MeshBasicMaterial({
        color: palette[Math.floor(Math.random() * palette.length)],
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      });
      const cube = new THREE.Mesh(cGeo, cMat);
      cube.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30 - 5
      );
      cube.userData = {
        rx: (Math.random() - 0.5) * 0.01,
        ry: (Math.random() - 0.5) * 0.01,
        floatSpeed: Math.random() * 0.5 + 0.3,
        floatAmp: Math.random() * 0.8 + 0.3,
        baseY: cube.position.y,
        phase: Math.random() * Math.PI * 2,
      };
      scene.add(cube);
      cubes.push(cube);
    }

    // ── ANIMATE ──
    let mouse = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Rotate particle cloud
      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.01;

      // Camera parallax
      camera.position.x += (mouse.x * 5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 3 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      // Rings
      rings.forEach((ring, i) => {
        ring.rotation.z += ring.userData.speed;
        ring.rotation.x += ring.userData.speed * 0.3;
        ring.position.y = ring.userData.baseY + Math.sin(t * 0.5 + i) * 1.5;
      });

      // Ico
      ico.rotation.x = t * 0.3;
      ico.rotation.y = t * 0.5;
      icoSolid.rotation.x = t * 0.3;
      icoSolid.rotation.y = t * 0.5;

      // Cubes
      cubes.forEach((c) => {
        c.rotation.x += c.userData.rx;
        c.rotation.y += c.userData.ry;
        c.position.y =
          c.userData.baseY +
          Math.sin(t * c.userData.floatSpeed + c.userData.phase) * c.userData.floatAmp;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);


  const featureIconColors = [
    { from: "#6366f1", to: "#9333ea" },
    { from: "#9333ea", to: "#ec4899" },
    { from: "#3b82f6", to: "#6366f1" },
    { from: "#10b981", to: "#14b8a6" },
    { from: "#f59e0b", to: "#f97316" },
    { from: "#f43f5e", to: "#ec4899" },
  ];

  const features = [
    { icon: BarChart3, title: "Real-time Dashboard", desc: "Live pipeline stats, conversion rates, and revenue insights at a glance." },
    { icon: Layers,    title: "Kanban Pipeline",    desc: "Drag-and-drop leads through stages — New, Contacted, Qualified, Closed." },
    { icon: Users,     title: "Team Workspaces",    desc: "Invite your team, assign roles, and collaborate in isolated workspaces." },
    { icon: Shield,    title: "Secure & Serverless", desc: "JWT auth on AWS Lambda — zero servers to manage, infinite scalability." },
    { icon: Zap,       title: "Custom Fields",      desc: "Admins can define dynamic fields that appear on all lead forms instantly." },
    { icon: Globe,     title: "AWS Native",         desc: "Powered by DynamoDB + SES + Lambda — enterprise-grade, pay-per-use." },
  ];

  const stats = [
    { value: "∞", label: "Scalability" },
    { value: "0", label: "Servers to Manage" },
    { value: "JWT", label: "Auth Security" },
    { value: "AWS", label: "Cloud Provider" },
  ];

  return (
    <div className="landing-root">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        .landing-root {
          background: #030712;
          color: #f1f5f9;
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* THREE.JS CANVAS */
        .three-canvas {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        /* GLASS OVERLAY */
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        /* NAV */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          background: rgba(3,7,18,0.6);
          border-bottom: 1px solid rgba(99,102,241,0.15);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #e0e7ff;
          letter-spacing: -0.02em;
        }

        .nav-logo {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.5);
        }

        .nav-actions { display: flex; gap: 12px; align-items: center; }

        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(99,102,241,0.4);
          color: #a5b4fc;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .btn-ghost:hover {
          border-color: #6366f1;
          color: #e0e7ff;
          background: rgba(99,102,241,0.1);
          box-shadow: 0 0 16px rgba(99,102,241,0.2);
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: white;
          padding: 8px 22px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
          letter-spacing: 0.01em;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(99,102,241,0.55);
        }

        /* HERO */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 2rem 4rem;
          text-align: center;
          z-index: 10;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          font-size: clamp(2.5rem, 7vw, 5.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          max-width: 900px;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #c7d2fe 40%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          color: #94a3b8;
          max-width: 580px;
          line-height: 1.7;
          margin-bottom: 3rem;
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 5rem;
        }

        .btn-hero-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: white;
          padding: 14px 32px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 8px 32px rgba(99,102,241,0.45);
          letter-spacing: -0.01em;
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(99,102,241,0.6);
        }

        .btn-hero-ghost {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          color: #cbd5e1;
          padding: 14px 32px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          backdrop-filter: blur(10px);
        }
        .btn-hero-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: white;
        }

        /* SCROLL INDICATOR */
        .scroll-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        /* STATS BAND */
        .stats-band {
          position: relative;
          z-index: 10;
          background: rgba(15,23,42,0.8);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(99,102,241,0.15);
          border-bottom: 1px solid rgba(99,102,241,0.15);
          padding: 3rem 2rem;
        }

        .stats-grid {
          max-width: 800px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #6366f1, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 4px;
        }

        /* FEATURES SECTION */
        .features-section {
          position: relative;
          z-index: 10;
          padding: 6rem 2rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-label {
          text-align: center;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6366f1;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .section-title {
          text-align: center;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f1f5f9;
          margin-bottom: 1rem;
          line-height: 1.15;
        }

        .section-sub {
          text-align: center;
          color: #64748b;
          font-size: 1rem;
          max-width: 500px;
          margin: 0 auto 4rem;
          line-height: 1.7;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .feature-card {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 20px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.05), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,0.3);
          box-shadow: 0 20px 60px rgba(99,102,241,0.12);
        }
        .feature-card:hover::before { opacity: 1; }

        .feature-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          position: relative;
        }

        .feature-title {
          font-size: 1rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }

        .feature-desc {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.65;
        }

        /* CTA BOTTOM SECTION */
        .cta-section {
          position: relative;
          z-index: 10;
          padding: 6rem 2rem 8rem;
          text-align: center;
          background: radial-gradient(ellipse 70% 80% at 50% 100%, rgba(99,102,241,0.12) 0%, transparent 70%);
        }

        .cta-box {
          max-width: 640px;
          margin: 0 auto;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 28px;
          padding: 4rem 3rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 100px rgba(0,0,0,0.4), 0 0 60px rgba(99,102,241,0.08);
        }

        .cta-title {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f1f5f9;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .cta-sub {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-cta-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: white;
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 8px 32px rgba(99,102,241,0.4);
          letter-spacing: -0.01em;
        }
        .btn-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(99,102,241,0.55);
        }

        .btn-cta-outline {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: transparent;
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
        }
        .btn-cta-outline:hover {
          border-color: #6366f1;
          background: rgba(99,102,241,0.08);
          color: #e0e7ff;
        }

        /* FOOTER */
        .footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid rgba(99,102,241,0.1);
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }

        .footer-copy {
          font-size: 0.8rem;
          color: #334155;
        }

        .stars-row {
          display: flex;
          gap: 4px;
          justify-content: center;
          margin-bottom: 1rem;
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .nav { padding: 0.75rem 1rem; }
          .cta-box { padding: 2.5rem 1.5rem; }
          .hero-ctas { flex-direction: column; align-items: center; }
          .btn-hero-primary, .btn-hero-ghost { width: 100%; justify-content: center; }
          .footer { justify-content: center; text-align: center; }
        }
      `}</style>

      {/* THREE.JS CANVAS */}
      <canvas ref={canvasRef} className="three-canvas" />

      {/* GRADIENT OVERLAY */}
      <div className="hero-overlay" />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-logo">
            <Activity size={18} color="white" />
          </div>
          Serverless CRM
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={onLogin} id="nav-login-btn">
            Sign In
          </button>
          <button className="btn-primary" onClick={onGetStarted} id="nav-signup-btn">
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero-badge">
            <Zap size={11} />
            Serverless &bull; Multi-tenant &bull; AWS Native
          </div>

          <h1 className="hero-title">
            The CRM Built for<br />
            Modern&nbsp;Teams
          </h1>

          <p className="hero-sub">
            Manage leads, track your pipeline, and collaborate with your team —
            all powered by AWS Lambda & DynamoDB with zero infrastructure overhead.
          </p>

          <div className="hero-ctas">
            <button
              className="btn-hero-primary"
              onClick={onGetStarted}
              id="hero-create-account-btn"
            >
              Create Free Account
              <ArrowRight size={18} />
            </button>
            <button
              className="btn-hero-ghost"
              onClick={onLogin}
              id="hero-signin-btn"
            >
              Sign In to Workspace
            </button>
          </div>

          <div className="scroll-hint">
            <span>Scroll to explore</span>
            <ChevronDown size={16} />
          </div>
        </motion.div>
      </section>

      {/* STATS BAND */}
      <motion.div
        className="stats-band"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FEATURES */}
      <section className="features-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="section-label">Everything You Need</div>
          <h2 className="section-title">Built for scale, designed for teams</h2>
          <p className="section-sub">
            From drag-and-drop pipelines to real-time dashboards — every feature
            your sales team needs, serverless.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <div
                className="feature-icon"
                style={{ background: `linear-gradient(135deg, ${featureIconColors[i].from}, ${featureIconColors[i].to})` }}
              >
                <f.icon size={22} color="white" />
              </div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="cta-box">
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#6366f1" color="#6366f1" />
              ))}
            </div>
            <div className="cta-title">
              Ready to close more deals?
            </div>
            <p className="cta-sub">
              Join your team's workspace or create a new one in seconds.
              No credit card required.
            </p>
            <div className="cta-buttons">
              <button
                className="btn-cta-primary"
                onClick={onGetStarted}
                id="cta-create-workspace-btn"
              >
                Create Your Workspace
                <ArrowRight size={18} />
              </button>
              <button
                className="btn-cta-outline"
                onClick={onLogin}
                id="cta-login-btn"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <Activity size={14} />
          Serverless CRM · AWS
        </div>
        <div className="footer-copy">
          Powered by AWS Lambda · DynamoDB · SES
        </div>
      </footer>
    </div>
  );
}
