const VER_3DBG_OBJ = "0.1.2"; // バージョン更新（アスペクト比に基づいた壁の動的配置ロジックを追加）

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
        m.trenchGroup = new THREE.Group();
        
        const floorTex = m.textures.trenchFloor;
        let floorMat;
        if (floorTex) {
            floorTex.wrapS = THREE.MirroredRepeatWrapping; 
            floorTex.wrapT = THREE.MirroredRepeatWrapping; 
            floorTex.repeat.set(8, 40); 
            floorMat = new THREE.MeshPhongMaterial({ map: floorTex, emissive: 0x333333 });
        } else {
            floorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
        }
        m.trenchFloor = new THREE.Mesh(new THREE.PlaneGeometry(400, 3000), floorMat);
        m.trenchFloor.rotation.x = -Math.PI / 2;
        m.trenchFloor.position.y = -60;
        m.trenchFloor.position.z = -500;
        m.trenchGroup.add(m.trenchFloor);

        const wallTex = m.textures.trenchWall;
        let wallMat;
        if (wallTex) {
            wallTex.wrapS = THREE.MirroredRepeatWrapping;
            wallTex.wrapT = THREE.MirroredRepeatWrapping;
            wallTex.repeat.set(40, 4); 
            wallMat = new THREE.MeshPhongMaterial({ map: wallTex, emissive: 0x333333 });
        } else {
            wallMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        }
        
        // ★初期化時にもカメラの比率（aspect）を使って壁の位置を計算
        const edgeX = 40 * m.camera.aspect;
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

        m.coreGroup = new THREE.Group();
        
        const coreBgMat = m.textures.coreBg ? new THREE.MeshBasicMaterial({ map: m.textures.coreBg }) : new THREE.MeshBasicMaterial({ color: 0x550000 });
        m.coreBg = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), coreBgMat);
        m.coreBg.position.set(0, 0, -800);
        m.coreGroup.add(m.coreBg);

        const reactorTex = m.textures.coreReactor;
        let reactorMat;
        if (reactorTex) {
            reactorMat = new THREE.MeshStandardMaterial({ map: reactorTex, emissive: 0xff3300, emissiveMap: reactorTex, emissiveIntensity: 1.5 });
        } else {
            reactorMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff0000, wireframe: true });
        }
        m.coreReactor = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 32), reactorMat);
        m.coreReactor.position.set(0, -100, -600);
        m.coreGroup.add(m.coreReactor);

        const redLight = new THREE.PointLight(0xff0000, 2, 1000);
        redLight.position.set(0, 0, -400);
        m.coreGroup.add(redLight);

        m.coreGroup.visible = false;
        m.scene.add(m.coreGroup);
    },

    updateAnimations: function(m) {
        if (m.currentStage === 5) {
            if (m.moon) {
                if (m.moon.position.y < -2000) { 
                    m.moon.position.y += 0.55; 
                }
                if (m.moon.scale.x < 4.5) { 
                    m.moon.scale.x += 0.0009; 
                    m.moon.scale.y += 0.0009;
                    m.moon.scale.z += 0.0009;
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
                
                // ★追加：壁が開く演出中でなければ、常にスマホのアスペクト比に合わせて壁の位置を追従させる
                if (!m.isCoreTransitioning) {
                    const dynamicEdgeX = 40 * m.camera.aspect; 
                    m.trenchLeftWall.position.x = -dynamicEdgeX;
                    m.trenchRightWall.position.x = dynamicEdgeX;
                }

                if (m.trenchFloor && m.trenchFloor.material.map) {
                    m.trenchFloor.material.map.offset.y += m.trenchScrollSpeed * 0.01;
                }
                if (m.trenchLeftWall && m.trenchLeftWall.material.map) {
                    m.trenchLeftWall.material.map.offset.x -= m.trenchScrollSpeed * 0.01;
                    m.trenchRightWall.material.map.offset.x += m.trenchScrollSpeed * 0.01;
                }

                if (m.isCoreTransitioning) {
                    m.coreGroup.visible = true;
                    if (m.trenchLeftWall.position.x > -800) {
                        m.trenchLeftWall.position.x -= 4;
                        m.trenchRightWall.position.x += 4;
                    }
                    if (m.coreGroup.position.y < -200) {
                        m.coreGroup.position.y += 5;
                    }
                }
            }

            if (m.coreGroup && m.coreGroup.visible && m.coreReactor) {
                m.coreReactor.rotation.y += 0.01;
                m.coreReactor.rotation.x += 0.005;
                const redLight = m.coreGroup.children[2];
                if(redLight) redLight.intensity = 2 + Math.sin(Date.now() * 0.005) * 1.0;
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
