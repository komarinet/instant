const VER_3DBG_OBJ = "0.3.2"; // バージョン更新（テクスチャの独立化によるスクロールバグ修正と、コアのサイズを1.5倍に最適化）

window.BG3DObjects = {
    createGround: function(m) {
        const groundTexture = m.textures.ground;
        let material;
        if (groundTexture) {
            groundTexture.wrapS = THREE.MirroredRepeatWrapping; 
            groundTexture.wrapT = THREE.MirroredRepeatWrapping; 
            groundTexture.repeat.set(4, 10);
            material = new THREE.MeshPhongMaterial({ map: groundTexture, shininess: 0 });
        } else {
            material = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 0 });
        }
        m.ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 400), material);
        m.ground.rotation.x = -Math.PI / 2; 
        m.ground.position.y = 0; 
        m.scene.add(m.ground);
    },

    createBuildings: function(m) {
        const numBuildings = 60; 
        const baseGeo = new THREE.BoxGeometry(1, 1, 1);
        const sideMaterials = [];
        const topMaterials = [];

        if (m.textures.sideatlas) {
            for (let i = 0; i < 5; i++) {
                const tex = m.textures.sideatlas.clone();
                tex.needsUpdate = true;
                tex.repeat.set(1/3, 1/2); 
                tex.offset.set((i % 3) * (1/3), 1 - (Math.floor(i / 3) + 1) * (1/2));
                sideMaterials.push(new THREE.MeshPhongMaterial({ map: tex }));
            }
        } else {
            sideMaterials.push(new THREE.MeshPhongMaterial({ color: 0x333333 }));
        }

        if (m.textures.topatlas) {
            for (let i = 0; i < 12; i++) {
                const tex = m.textures.topatlas.clone();
                tex.needsUpdate = true;
                tex.repeat.set(1/4, 1/3);
                tex.offset.set((i % 4) * (1/4), 1 - (Math.floor(i / 4) + 1) * (1/3));
                topMaterials.push(new THREE.MeshPhongMaterial({ map: tex }));
            }
        } else {
            topMaterials.push(new THREE.MeshPhongMaterial({ color: 0x555555 }));
        }

        for (let i = 0; i < numBuildings; i++) {
            const w = Math.random() * 15 + 10;
            const d = Math.random() * 15 + 10;
            const h = Math.random() * 40 + 20;

            const sMat = sideMaterials[Math.floor(Math.random() * sideMaterials.length)];
            const tMat = topMaterials[Math.floor(Math.random() * topMaterials.length)];
            const materials = [sMat, sMat, tMat, sMat, sMat, sMat];
            
            const mesh = new THREE.Mesh(baseGeo, materials);
            mesh.scale.set(w, h, d);
            mesh.position.x = (Math.random() - 0.5) * 200;
            mesh.position.z = (Math.random() - 0.5) * 400 - 50; 
            mesh.position.y = h / 2; 

            m.scene.add(mesh);
            m.buildings.push(mesh);
        }
    },

    createClouds: function(m) {
        const numClouds = 20;
        const cloudGeo = new THREE.PlaneGeometry(40, 40);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0x111115,
            transparent: true,
            opacity: 0.4,
            depthWrite: false 
        });

        for (let i = 0; i < numClouds; i++) {
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.position.x = (Math.random() - 0.5) * 200;
            cloud.position.y = Math.random() * 20 + 60; 
            cloud.position.z = (Math.random() - 0.5) * 300;
            cloud.rotation.x = -Math.PI / 2; 
            cloud.rotation.z = Math.random() * Math.PI * 2;
            
            m.scene.add(cloud);
            m.clouds.push(cloud);
        }
    },

    createCandles: function(m) {
        const numCandles = 2000; 

        m.flameMaterial = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0.0 } },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
                void main() {
                    vec2 p = vUv * 2.0 - 1.0; 
                    float offset = rand(vWorldPosition.xz);
                    float t = uTime * 4.0 + offset * 10.0;
                    
                    p.x += sin(t + p.y * 3.0) * 0.15 * max(0.0, p.y + 0.5);
                    
                    float d = length(vec2(p.x * (1.5 - p.y), p.y + 0.3));
                    float alpha = smoothstep(0.9, 0.1, d);
                    
                    vec3 col = mix(vec3(0.0, 0.3, 0.8), vec3(1.0, 0.3, 0.0), smoothstep(-0.8, -0.3, p.y));
                    col = mix(col, vec3(1.0, 0.8, 0.1), smoothstep(-0.3, 0.5, p.y));
                    
                    float core = smoothstep(0.3, 0.0, d);
                    col = mix(col, vec3(1.0, 1.0, 1.0), core);
                    
                    float flicker = 0.85 + 0.15 * sin(t * 3.0 + offset * 20.0);
                    
                    gl_FragColor = vec4(col * flicker, alpha * flicker);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });

        const baseBodyGeo = new THREE.CylinderGeometry(0.8, 1, 1, 8); 
        const baseWickGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 4);
        const baseFlameGeo = new THREE.PlaneGeometry(1, 1.5);

        const sideMat = m.textures.candle 
            ? new THREE.MeshPhongMaterial({ map: m.textures.candle, emissive: 0x331100 }) 
            : new THREE.MeshPhongMaterial({ color: 0xddccaa, emissive: 0x442211, shininess: 30 });
        const topMat = new THREE.MeshPhongMaterial({ color: 0xffeedd, emissive: 0xaa5522, shininess: 50 }); 
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 }); 

        const r = 0.8;  
        const h = 8;    
        const flameSize = r * 4.0; 

        for (let i = 0; i < numCandles; i++) {
            const candleGroup = new THREE.Group();

            const bodyMesh = new THREE.Mesh(baseBodyGeo, [sideMat, topMat, sideMat]); 
            bodyMesh.scale.set(r, h, r);
            bodyMesh.position.y = h / 2; 
            candleGroup.add(bodyMesh);

            const wickMesh = new THREE.Mesh(baseWickGeo, wickMat);
            wickMesh.scale.set(1, 1, 1);
            wickMesh.position.y = h + 1; 
            candleGroup.add(wickMesh);

            const flameMesh = new THREE.Mesh(baseFlameGeo, m.flameMaterial);
            flameMesh.scale.set(flameSize, flameSize, 1);
            flameMesh.position.y = h + 1 + flameSize * 0.4; 
            candleGroup.add(flameMesh);

            candleGroup.position.x = (Math.random() - 0.5) * 400; 
            candleGroup.position.y = 0; 
            candleGroup.position.z = (Math.random() - 0.5) * 800 - 100; 

            candleGroup.visible = false; 

            m.scene.add(candleGroup);
            m.candles.push(candleGroup);
        }
    },

    createSpace: function(m) {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const posArray = new Float32Array(starCount * 3);
        for(let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 6000;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMat = new THREE.PointsMaterial({ 
            size: 4, 
            color: 0xffffff, 
            transparent: true, 
            opacity: 1.0, 
            depthWrite: false
        });
        m.starField = new THREE.Points(starGeo, starMat);
        m.starField.visible = false;
        m.scene.add(m.starField);

        const moonGeo = new THREE.SphereGeometry(400, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({ 
            map: m.textures.moon || null, 
            roughness: 0.8, 
            metalness: 0.1,
            emissive: 0x666666 
        });
        m.moon = new THREE.Mesh(moonGeo, moonMat);
        m.moon.visible = false;
        m.scene.add(m.moon);

        m.moonLight = new THREE.DirectionalLight(0xffffff, 1.2);
        m.moonLight.position.set(200, 200, 200); 
        m.moonLight.visible = false;
        m.scene.add(m.moonLight);
    },

    createFinalStage: function(m) {
        // ==========================================
        // 上層：グレーのトレンチ（割れる床と壁）
        // ==========================================
        m.trenchGroup = new THREE.Group();
        
        const floorTex = m.textures.trenchFloor;
        let floorMat = floorTex ? new THREE.MeshPhongMaterial({ map: floorTex, emissive: 0x333333 }) : new THREE.MeshPhongMaterial({ color: 0x222222 });
        if (floorTex) { floorTex.wrapS = THREE.MirroredRepeatWrapping; floorTex.wrapT = THREE.MirroredRepeatWrapping; floorTex.repeat.set(4, 40); }
        
        const floorGeo = new THREE.PlaneGeometry(1000, 3000);
        m.trenchFloorLeft = new THREE.Mesh(floorGeo, floorMat);
        m.trenchFloorLeft.rotation.x = -Math.PI / 2;
        m.trenchFloorLeft.position.set(-500, -60, -500); 
        m.trenchGroup.add(m.trenchFloorLeft);

        m.trenchFloorRight = new THREE.Mesh(floorGeo, floorMat);
        m.trenchFloorRight.rotation.x = -Math.PI / 2;
        m.trenchFloorRight.position.set(500, -60, -500);
        m.trenchGroup.add(m.trenchFloorRight);

        const wallTex = m.textures.trenchWall;
        let wallMat = wallTex ? new THREE.MeshPhongMaterial({ map: wallTex, emissive: 0x333333 }) : new THREE.MeshPhongMaterial({ color: 0x333333 });
        if (wallTex) { wallTex.wrapS = THREE.MirroredRepeatWrapping; wallTex.wrapT = THREE.MirroredRepeatWrapping; wallTex.repeat.set(40, 4); }
        
        const edgeX = 90 * m.camera.aspect;
        const wallGeo = new THREE.PlaneGeometry(3000, 300);
        
        m.trenchLeftWall = new THREE.Mesh(wallGeo, wallMat);
        m.trenchLeftWall.rotation.y = Math.PI / 2;
        m.trenchLeftWall.position.set(-edgeX, 0, -500);
        m.trenchGroup.add(m.trenchLeftWall);

        m.trenchRightWall = new THREE.Mesh(wallGeo, wallMat);
        m.trenchRightWall.rotation.y = -Math.PI / 2;
        m.trenchRightWall.position.set(edgeX, 0, -500);
        m.trenchGroup.add(m.trenchRightWall);

        m.trenchGroup.visible = false;
        m.scene.add(m.trenchGroup);

        // ==========================================
        // 下層：赤いコア空間（割れた下から現れる）
        // ==========================================
        m.coreGroup = new THREE.Group();
        
        // ★バグ修正：テクスチャを独立させるため clone() を使用
        const coreFloorTex = m.textures.coreBg ? m.textures.coreBg.clone() : null;
        if (coreFloorTex) { coreFloorTex.wrapS = THREE.MirroredRepeatWrapping; coreFloorTex.wrapT = THREE.MirroredRepeatWrapping; coreFloorTex.repeat.set(8, 40); coreFloorTex.needsUpdate = true; }
        const coreFloorMat = coreFloorTex ? new THREE.MeshPhongMaterial({ map: coreFloorTex, emissive: 0x550000 }) : new THREE.MeshPhongMaterial({ color: 0xaa0000 });
        
        m.coreFloorLeft = new THREE.Mesh(floorGeo, coreFloorMat);
        m.coreFloorLeft.rotation.x = -Math.PI / 2;
        m.coreFloorLeft.position.set(-500, -140, -500); // グレー床(-60)のさらに下
        m.coreGroup.add(m.coreFloorLeft);

        m.coreFloorRight = new THREE.Mesh(floorGeo, coreFloorMat);
        m.coreFloorRight.rotation.x = -Math.PI / 2;
        m.coreFloorRight.position.set(500, -140, -500);
        m.coreGroup.add(m.coreFloorRight);

        // ★バグ修正：壁用にも clone() で独立したテクスチャを用意
        const coreWallTex = m.textures.coreBg ? m.textures.coreBg.clone() : null;
        if (coreWallTex) { coreWallTex.wrapS = THREE.MirroredRepeatWrapping; coreWallTex.wrapT = THREE.MirroredRepeatWrapping; coreWallTex.repeat.set(40, 4); coreWallTex.needsUpdate = true; }
        const coreWallMat = coreWallTex ? new THREE.MeshPhongMaterial({ map: coreWallTex, emissive: 0x550000 }) : new THREE.MeshPhongMaterial({ color: 0xaa0000 });
        
        const redEdgeX = 140 * m.camera.aspect; 
        m.coreLeftWall = new THREE.Mesh(wallGeo, coreWallMat);
        m.coreLeftWall.rotation.y = Math.PI / 2;
        m.coreLeftWall.position.set(-redEdgeX, -80, -500);
        m.coreGroup.add(m.coreLeftWall);

        m.coreRightWall = new THREE.Mesh(wallGeo, coreWallMat);
        m.coreRightWall.rotation.y = -Math.PI / 2;
        m.coreRightWall.position.set(redEdgeX, -80, -500);
        m.coreGroup.add(m.coreRightWall);

        // ★修正：コアサイズを 40の1.5倍(60) に設定し、Z軸でしっかりカメラ内に収まる位置に調整
        const reactorTex = m.textures.coreReactor;
        let reactorMat = reactorTex ? new THREE.MeshStandardMaterial({ map: reactorTex, emissive: 0xff3300, emissiveMap: reactorTex, emissiveIntensity: 1.5 }) : new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff0000, wireframe: true });
        
        m.coreReactor = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 32), reactorMat);
        m.coreReactor.position.set(0, -300, -300); // 初期は地下（Y:-300）に隠しておく
        m.coreGroup.add(m.coreReactor);

        const redLight = new THREE.PointLight(0xff0000, 3.0, 1500);
        redLight.position.set(0, -20, -200);
        m.coreGroup.add(redLight);

        m.coreGroup.visible = true; // 初めから置いておき、グレーの床で隠す
        m.scene.add(m.coreGroup);
    },

    updateAnimations: function(m) {
        if (m.currentStage === 5) {
            if (m.moon) {
                const aspectFactor = Math.min(1, m.camera.aspect);
                const targetScale = 4.5 * aspectFactor;
                
                if (m.moon.position.y < -2000) { 
                    m.moon.position.y += 0.55; 
                }
                
                if (m.moon.scale.x < targetScale) { 
                    m.moon.scale.x += 0.0009 * aspectFactor; 
                    m.moon.scale.y += 0.0009 * aspectFactor;
                    m.moon.scale.z += 0.0009 * aspectFactor;
                }
                m.moon.rotation.y += 0.001;
                m.moon.rotation.x += 0.0005;
            }
            if (m.starField) {
                m.starField.rotation.y += 0.0003;
                m.starField.rotation.x += 0.0001;
            }
        }

        if (m.currentStage === 6) {
            if (m.trenchGroup && m.trenchGroup.visible) {
                
                if (!m.isCoreTransitioning) {
                    const dynamicEdgeX = 90 * m.camera.aspect; 
                    m.trenchLeftWall.position.x = -dynamicEdgeX;
                    m.trenchRightWall.position.x = dynamicEdgeX;
                    
                    if (m.trenchFloorLeft) m.trenchFloorLeft.position.x = -500;
                    if (m.trenchFloorRight) m.trenchFloorRight.position.x = 500;

                    const redEdgeX = 140 * m.camera.aspect;
                    if (m.coreLeftWall) m.coreLeftWall.position.x = -redEdgeX;
                    if (m.coreRightWall) m.coreRightWall.position.x = redEdgeX;
                }

                if (m.trenchFloorLeft && m.trenchFloorLeft.material.map) {
                    m.trenchFloorLeft.material.map.offset.y += m.trenchScrollSpeed * 0.01;
                    m.trenchFloorRight.material.map.offset.y += m.trenchScrollSpeed * 0.01;
                }
                if (m.trenchLeftWall && m.trenchLeftWall.material.map) {
                    m.trenchLeftWall.material.map.offset.x -= m.trenchScrollSpeed * 0.01;
                    m.trenchRightWall.material.map.offset.x += m.trenchScrollSpeed * 0.01;
                }

                if (m.isCoreTransitioning) {
                    const openSpeed = 2.0;
                    if (m.trenchLeftWall.position.x > -800) {
                        m.trenchLeftWall.position.x -= openSpeed;
                        m.trenchRightWall.position.x += openSpeed;
                        if (m.trenchFloorLeft) m.trenchFloorLeft.position.x -= openSpeed;
                        if (m.trenchFloorRight) m.trenchFloorRight.position.x += openSpeed;
                    }

                    // ★修正：目標位置（赤い床の上に乗る位置：Y = -60付近）までせり上げる
                    if (m.coreReactor && m.coreReactor.position.y < -60) {
                        m.coreReactor.position.y += 2.0;
                    }
                }
            }

            if (m.coreGroup && m.coreGroup.visible) {
                if (m.coreFloorLeft && m.coreFloorLeft.material.map) {
                    m.coreFloorLeft.material.map.offset.y += m.trenchScrollSpeed * 0.01;
                    m.coreFloorRight.material.map.offset.y += m.trenchScrollSpeed * 0.01;
                }
                if (m.coreLeftWall && m.coreLeftWall.material.map) {
                    m.coreLeftWall.material.map.offset.x -= m.trenchScrollSpeed * 0.01;
                    m.coreRightWall.material.map.offset.x += m.trenchScrollSpeed * 0.01;
                }

                if (m.coreReactor) {
                    m.coreReactor.rotation.y += 0.01;
                    m.coreReactor.rotation.x += 0.005;
                }
                const redLight = m.coreGroup.children.find(c => c.isPointLight);
                if(redLight) redLight.intensity = 2.5 + Math.sin(Date.now() * 0.005) * 1.5;
            }
        }

        if (m.ground && m.ground.material.map && m.ground.visible) {
            m.ground.material.map.offset.y += (m.scrollSpeed / 40) * Math.sign(m.ground.material.map.repeat.y);
        }

        if (m.flameMaterial) {
            m.flameMaterial.uniforms.uTime.value += 0.016; 
        }

        m.candles.forEach(c => {
            if (!c.visible) return; 
            
            c.position.z += m.scrollSpeed;

            if (c.position.z > 40) {
                c.position.z -= 800; 
                c.position.x = (Math.random() - 0.5) * 400;
            }
            
            const flame = c.children[2];
            if (flame && m.camera) {
                flame.quaternion.copy(m.camera.quaternion);
            }
        });

        m.buildings.forEach(b => {
            if (!b.visible) return; 
            b.position.z += m.scrollSpeed;
            if (b.position.z > 40) {
                b.position.z -= 400;
                b.position.x = (Math.random() - 0.5) * 200;
            }
        });

        m.clouds.forEach(c => {
            if (!c.visible) return; 
            c.position.z += m.cloudScrollSpeed;
            c.rotation.z += 0.01;
            if (c.position.z > 100) {
                c.position.z -= 400;
                c.position.x = (Math.random() - 0.5) * 200;
            }
        });
    }
};
