window.addEventListener('load', () => {
  setTimeout(function initThree() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const wrap = document.getElementById('hero-canvas-wrap');
    const W = () => wrap.clientWidth;
    const H = () => wrap.clientHeight;

    // Desliga antialias e diminui o pixel ratio para desafogar a GPU/CPU em monitores grandes
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(W(), H());
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const count = 2800;
    const posArr = new Float32Array(count * 3);
    const spread = 7;
    for (let i = 0; i < count; i++) {
        posArr[i * 3] = (Math.random() - 0.5) * spread;
        posArr[i * 3 + 1] = (Math.random() - 0.5) * spread;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.PointsMaterial({ color: 0x0F6E56, size: 0.018, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const torusGeo = new THREE.TorusKnotGeometry(1.1, 0.32, 140, 18);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0x0F6E56, wireframe: true, transparent: true, opacity: 0.18 });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    scene.add(torus);

    const ringGeo = new THREE.TorusGeometry(1.9, 0.004, 4, 140);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1D9E75, transparent: true, opacity: 0.22 });
    const ring3d = new THREE.Mesh(ringGeo, ringMat);
    ring3d.rotation.x = Math.PI / 3;
    scene.add(ring3d);

    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        targetX = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
        targetY = ((e.clientY - r.top) / r.height - 0.5) * 1.2;
    }, { passive: true });
    wrap.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

    let t = 0;
    function animate3d() {
        requestAnimationFrame(animate3d);
        t += 0.004;
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        torus.rotation.x = t * 0.4 + currentY * 0.8;
        torus.rotation.y = t * 0.6 + currentX * 0.8;
        ring3d.rotation.z = t * 0.2;
        ring3d.rotation.y = t * 0.15 + currentX * 0.4;
        particles.rotation.y = t * 0.05 + currentX * 0.1;
        particles.rotation.x = currentY * 0.08;
        renderer.render(scene, camera);
    }
    animate3d();

    window.addEventListener('resize', () => {
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
    }, { passive: true });
  }, 200); // Atraso de 200ms após o load
});