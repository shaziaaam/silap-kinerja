import React, { useEffect, useRef } from 'react';

// Continent landmass polygons (longitude, latitude points)
const CONTINENTS = [
    // Indonesia Archipelago & Southeast Asia
    [ [95, 6], [106, 6], [116, 1], [125, 4], [141, -2], [141, -9], [130, -8], [115, -8], [105, -6], [95, 0] ],
    // Australia
    [ [113, -14], [130, -11], [145, -13], [153, -28], [146, -38], [134, -34], [115, -35], [113, -24] ],
    // Asia & Europe
    [ [30, 70], [60, 72], [100, 75], [140, 70], [170, 60], [140, 40], [120, 30], [100, 15], [80, 10], [70, 20], [60, 25], [50, 30], [35, 35], [10, 35], [-10, 40], [-10, 60], [10, 60] ],
    // Africa
    [ [-17, 15], [-17, 30], [30, 30], [42, 10], [50, 10], [40, -10], [35, -35], [20, -35], [10, -5], [-15, 5] ],
    // North America
    [ [-165, 65], [-140, 60], [-120, 50], [-100, 30], [-80, 25], [-75, 40], [-60, 45], [-65, 65], [-100, 70], [-140, 70] ],
    // South America
    [ [-80, 10], [-60, 10], [-35, -5], [-40, -20], [-60, -40], [-75, -45], [-75, -20] ],
];

export default function EarthGlobe({ className = '' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let rotationAngle = 0.6; // Initial longitude offset facing Indonesia

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        resize();
        window.addEventListener('resize', resize);

        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (!width || !height || width <= 0 || height <= 0) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.min(width, height) * 0.37;

            if (!radius || radius <= 0 || !isFinite(radius)) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            try {
                // 1. Atmosphere Outer Soft Glow Gradient
                const rAtmosInner = Math.max(0.1, radius * 0.95);
                const rAtmosOuter = Math.max(0.2, radius * 1.25);
                const atmosGrad = ctx.createRadialGradient(cx, cy, rAtmosInner, cx, cy, rAtmosOuter);
                atmosGrad.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
                atmosGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
                atmosGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
                ctx.fillStyle = atmosGrad;
                ctx.fill();

                // 2. Ocean Surface Gradient (Sky Blue to Deep Sea Navy)
                const rOceanInner = Math.max(0.1, radius * 0.1);
                const rOceanOuter = Math.max(0.2, radius);
                const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, rOceanInner, cx, cy, rOceanOuter);
                oceanGrad.addColorStop(0, '#38bdf8');
                oceanGrad.addColorStop(0.35, '#0284c7');
                oceanGrad.addColorStop(0.75, '#0369a1');
                oceanGrad.addColorStop(1, '#0c4a6e');

                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = oceanGrad;
                ctx.fill();

                // Clip all drawings inside the sphere
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.clip();

                // 3. Latitude & Longitude Grid Lines
                ctx.lineWidth = 0.8;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';

                // Latitude lines
                for (let lat = -60; lat <= 60; lat += 30) {
                    const rad = (lat * Math.PI) / 180;
                    const rLat = radius * Math.cos(rad);
                    const yLat = cy - radius * Math.sin(rad);
                    if (rLat > 0) {
                        ctx.beginPath();
                        ctx.ellipse(cx, yLat, rLat, Math.max(0.1, rLat * 0.22), 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }

                // Longitude curves
                for (let lon = 0; lon < 360; lon += 30) {
                    const rad = ((lon + rotationAngle * (180 / Math.PI)) * Math.PI) / 180;
                    const cosVal = Math.cos(rad);
                    const sinVal = Math.sin(rad);
                    if (sinVal > 0) { // Front side curve
                        const rx = radius * Math.abs(cosVal);
                        if (rx > 0) {
                            ctx.beginPath();
                            ctx.ellipse(cx, cy, rx, radius, 0, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                }

                // 4. Continent Landmass Polygons Projection
                ctx.fillStyle = '#10b981'; // Earth land green
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 1.2;

                CONTINENTS.forEach((poly) => {
                    ctx.beginPath();
                    let started = false;

                    poly.forEach(([lonDeg, latDeg]) => {
                        const lon = ((lonDeg * Math.PI) / 180) + rotationAngle;
                        const lat = (latDeg * Math.PI) / 180;

                        // 3D Sphere Projection Coordinates
                        const x3d = radius * Math.cos(lat) * Math.sin(lon);
                        const y3d = radius * Math.sin(lat);
                        const z3d = radius * Math.cos(lat) * Math.cos(lon);

                        if (z3d > -radius * 0.1) { // Visible front side
                            const px = cx + x3d;
                            const py = cy - y3d;

                            if (!started) {
                                ctx.moveTo(px, py);
                                started = true;
                            } else {
                                ctx.lineTo(px, py);
                            }
                        }
                    });

                    if (started) {
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                });

                // 5. Semarang Staklim Location Pin
                const semarangLon = ((110.4 * Math.PI) / 180) + rotationAngle;
                const semarangLat = (-6.9 * Math.PI) / 180;
                const sx3d = radius * Math.cos(semarangLat) * Math.sin(semarangLon);
                const sy3d = radius * Math.sin(semarangLat);
                const sz3d = radius * Math.cos(semarangLat) * Math.cos(semarangLon);

                if (sz3d > 0) {
                    const spx = cx + sx3d;
                    const spy = cy - sy3d;

                    // Outer pulsing red aura
                    ctx.beginPath();
                    ctx.arc(spx, spy, 10, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                    ctx.fill();

                    // Inner pin dot
                    ctx.beginPath();
                    ctx.arc(spx, spy, 4.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(spx, spy, 4.5, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.8;
                    ctx.stroke();
                }

                // 6. Day / Night Day-Night Terminator Shadow Overlay
                const shadowGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
                shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
                shadowGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
                shadowGrad.addColorStop(1, 'rgba(3, 105, 161, 0.55)');
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = shadowGrad;
                ctx.fill();

                ctx.restore();
            } catch (err) {
                // Ignore transient canvas rendering error
            }

            // Smooth slow rotation
            rotationAngle += 0.003;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full ${className}`}
            style={{ display: 'block' }}
        />
    );
}
