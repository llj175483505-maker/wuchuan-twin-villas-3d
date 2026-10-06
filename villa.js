import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// All dimensions are metres. The 12 × 15 outer envelope includes the recessed
// porch and balconies; their floor slabs do not enlarge the 180 m² footprint.
export function createVilla({ scene, M, box, cylinder, x, z, name, rotation = 0 }) {
  const root = new THREE.Group();
  root.name = name || '180㎡住宅';
  root.position.set(x, 0, z);
  scene.add(root);
  const layers = [], ceilings = [], lamps = [], finish = .18, storey = 3.3;
  const cream = M.wall.clone(); cream.color.set('#f3eee2');
  const molding = M.wall.clone(); molding.color.set('#e3dfd4');
  const charcoal = M.dark.clone(); charcoal.color.set('#272e30'); charcoal.roughness = .43;
  const stone = M.path.clone(); stone.color.set('#b6b5ae'); stone.roughness = .72;
  const interior = M.wall.clone(); interior.color.set('#e9dfce');
  const timber = (M.timber || M.wood).clone(); timber.color.set('#735c45');
  const glass = M.glass.clone(); glass.color.set('#bdcaca'); glass.opacity = .36;
  const roofMat = M.roof.clone();
  roofMat.color.set('#252b2e');roofMat.roughness=.95;roofMat.metalness=0;
  roofMat.map=null;roofMat.normalMap=null;roofMat.envMapIntensity=.10;
  const glow = new THREE.MeshStandardMaterial({ color: '#fff0c7', emissive: '#ffd49a', emissiveIntensity: .12, roughness: .5 });
  const fabric = M.fabric.clone(); fabric.color.set('#dcd5c5');
  const leaf = M.leaf.clone(); leaf.color.set('#435d3b');
  const curtain = new THREE.MeshStandardMaterial({ color: '#d7ccba', roughness: 1, side: THREE.DoubleSide });
  const bronze = new THREE.MeshStandardMaterial({ color: '#9a875f', metalness: .65, roughness: .35 });
  const roof = new THREE.Group(); root.add(roof);
  const b = (w,h,d,px,py,pz,mat,parent) => box(w,h,d,px,py,pz,mat,parent);
  const c = (rt,rb,h,px,py,pz,mat,parent,s=12) => cylinder(rt,rb,h,px,py,pz,mat,parent,s);

  // A real opening: walls are assembled around the void instead of behind glass.
  // The segment is built in facade coordinates, then oriented to the chosen wall.
  function facadePanel(parent, cx, cz, width, y, angle, opening = true, door = false) {
    const panel = new THREE.Group(); panel.position.set(cx,y,cz); panel.rotation.y=angle;
    parent.add(panel);
    const h=3.08, depth=.22, ow=door?2.64:Math.min(2.55,width-.72), sill=door?.04:.48, oh=door?2.73:2.47;
    if (!opening) { b(width,h,depth,0,h/2,0,cream,panel); return; }
    const pier=(width-ow)/2;
    b(pier,h,depth,-(ow+pier)/2,h/2,0,cream,panel);
    b(pier,h,depth,(ow+pier)/2,h/2,0,cream,panel);
    if(sill>0) b(ow,sill,depth,0,sill/2,0,cream,panel);
    const lintel=h-sill-oh;
    if(lintel>0) b(ow,lintel,depth,0,sill+oh+lintel/2,0,cream,panel);
    const wy=sill+oh/2, fw=.068;
    b(ow+.14,.075,.29,0,sill-.007,.017,molding,panel);
    b(ow+.16,.09,.28,0,sill+oh+.038,.015,molding,panel);
    for(const sx of [-1,1]) b(fw,oh,.135,sx*(ow-fw)/2,wy,.035,charcoal,panel);
    for(const sy of [sill+.032,sill+oh-.032]) b(ow,fw,.135,0,sy,.035,charcoal,panel);
    b(ow-.11,oh-.11,.021,0,wy,.046,glass,panel);
    b(.05,oh,.13,0,wy,.056,charcoal,panel);
    if(door) {
      b(ow,.065,.13,0,sill+oh-.48,.06,charcoal,panel);
      if(y<1) {
        for(const sx of [-1,1]) {
          b(.048,.46,.035,sx*.16,1.22,.145,bronze,panel);
          b(1.18,.50,.055,sx*.64,.33,.047,timber,panel);
        }
      }
    } else {
      b(ow,.05,.13,0,sill+oh-.49,.055,charcoal,panel);
      for(const sx of [-1,1]) b(.033,oh,.12,sx*ow*.32,wy,.053,charcoal,panel);
      // Narrow side curtains leave the opening transparent and readable.
      for(const sx of [-1,1]) b(.28,oh-.1,.045,sx*(ow/2-.25),wy,-.18,curtain,panel);
    }
  }

  function planter(parent, px, y, pz, small=false) {
    const s=small?.72:1;
    const profile=[[.20,0],[.27,.06],[.32,.43],[.34,.53],[.34,.58],[.29,.58]].map(([r,h])=>new THREE.Vector2(r*s,h*s));
    const pot=new THREE.Mesh(new THREE.LatheGeometry(profile,16),molding);
    pot.position.set(px,y,pz); pot.castShadow=true;pot.receiveShadow=true;parent.add(pot);
    c(.045*s,.05*s,.35*s,px,y+.7*s,pz,timber,parent);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.4*s,2),leaf);
    crown.position.set(px,y+1.05*s,pz);crown.scale.set(1,.92,1);crown.castShadow=true;parent.add(crown);
  }

  const balusterGeo=new THREE.LatheGeometry([[.072,0],[.074,.07],[.047,.12],[.045,.30],[.082,.43],[.074,.54],[.039,.63],[.037,.74],[.065,.79]].map(([r,h])=>new THREE.Vector2(r,h)),8);
  function balcony(parent,y) {
    b(5.12,.17,1.58,0,y-.05,6.70,molding,parent);
    b(5.18,.075,.12,0,y-.165,7.39,cream,parent);
    b(5.15,.085,.13,0,y+.88,7.32,charcoal,parent);
    b(5.12,.075,.17,0,y+.09,7.32,molding,parent);
    const positions=[];
    for(let k=0;k<19;k++) positions.push([-2.25+k*.25,y+.12,7.32]);
    for(const sx of [-1,1]) {
      b(.17,.91,.17,sx*2.48,y+.49,7.30,cream,parent);
      b(.22,.07,.22,sx*2.48,y+.97,7.30,molding,parent);
      b(.11,.085,1.42,sx*2.48,y+.88,6.68,charcoal,parent);
      for(let k=0;k<5;k++) positions.push([sx*2.48,y+.12,6.05+k*.25]);
    }
    const rails=new THREE.InstancedMesh(balusterGeo,cream,positions.length);
    const dummy=new THREE.Object3D();
    positions.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();rails.setMatrixAt(i,dummy.matrix);});
    rails.castShadow=true;rails.receiveShadow=true;parent.add(rails);
  }

  function ceilingLamp(parent,px,y,pz,r=.065) {
    c(r*1.25,r*1.25,.035,px,y+.015,pz,charcoal,parent,12);
    c(r,r,.012,px,y-.007,pz,glow,parent,12);
  }
  function wallLamp(parent,px,y,pz) {
    b(.12,.37,.075,px,y,pz,charcoal,parent);
    b(.087,.25,.043,px,y,pz+.05,glow,parent);
  }

  function furnishings(parent,y,level) {
    // Front-left lounge; front-right level-access elders' room on the first floor.
    b(.14,2.83,10.3,-2.63,y+1.42,-.74,interior,parent);
    b(.14,2.83,10.3,2.63,y+1.42,-.74,interior,parent);
    b(3.15,2.83,.12,-4.25,y+1.42,-1.58,interior,parent);
    b(3.15,2.83,.12,4.25,y+1.42,-1.58,interior,parent);
    if(level===0) {
      b(2.40,.30,.92,-4.15,y+.28,4.55,fabric,parent);
      b(2.43,.63,.16,-4.15,y+.63,4.96,fabric,parent);
      for(const sx of [-1,1]) b(.15,.50,.93,-4.15+sx*1.2,y+.48,4.55,fabric,parent);
      b(1.23,.065,.68,-4.15,y+.48,2.98,timber,parent);
      for(const px of [-4.62,-3.68]) for(const pz of [2.75,3.2]) b(.035,.40,.035,px,y+.25,pz,bronze,parent);
      b(2.3,.026,2.0,-4.15,y+.035,3.43,fabric,parent);
    } else {
      b(2,.24,2.17,-4.2,y+.27,3.43,timber,parent);
      b(1.92,.20,2.10,-4.2,y+.47,3.43,fabric,parent);
      b(2.05,.80,.13,-4.2,y+.63,2.3,timber,parent);
    }
    b(1.83,.25,2.12,4.23,y+.27,3.28,timber,parent);
    b(1.79,.20,2.06,4.23,y+.48,3.28,fabric,parent);
    b(1.94,.90,.13,4.23,y+.70,2.12,timber,parent);
    for(const px of [3.83,4.62]) b(.64,.13,.37,px,y+.64,2.61,molding,parent);
    b(.40,.48,.44,5.4,y+.24,2.38,timber,parent);
    // The central circulation strip stays open between foyer and rear stair.
    b(2.22,.065,1.02,0,y+.77,-.25,timber,parent);
    for(const px of [-.88,.88]) for(const pz of [-.61,.11]) b(.06,.7,.06,px,y+.39,pz,charcoal,parent);
    for(const px of [-.72,.72]) for(const pz of [-1.18,.69]) {
      b(.46,.07,.45,px,y+.46,pz,fabric,parent);
      b(.46,.53,.055,px,y+.72,pz+(pz<0?-.2:.2),timber,parent);
      for(const dx of [-.16,.16]) b(.035,.43,.035,px+dx,y+.23,pz,timber,parent);
    }
    // A compact two-flight stair establishes sensible floor-to-floor circulation.
    for(let step=0;step<10;step++) {
      b(1.0,.09,.28,-1.65,y+.15+step*.165,-4.22-step*.27,stone,parent);
      b(1.0,.09,.28,-.45,y+1.8+step*.165,-6.66+step*.27,stone,parent);
    }
    b(2.28,.10,.60,-1.04,y+1.71,-6.92,stone,parent);
    c(.23,.23,.30,0,y+2.66,1.07,glow,parent,16);
    c(.012,.012,.25,0,y+2.94,1.07,charcoal,parent,8);
  }

  // Merge same-material meshes per floor, keeping floor switching cheap on phones.
  function compact(group) {
    group.updateMatrixWorld(true);
    const buckets=new Map(), meshes=[];
    const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
    group.traverse(object=>{
      if(!object.isMesh || object.isInstancedMesh || Array.isArray(object.material))return;
      const geometry=object.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld));
      if(!buckets.has(object.material))buckets.set(object.material,[]);
      buckets.get(object.material).push(geometry);meshes.push(object);
    });
    for(const mesh of meshes)mesh.removeFromParent();
    for(const [material,geometries] of buckets) {
      const merged=mergeGeometries(geometries,false);
      if(!merged)throw new Error('Villa geometry could not be combined');
      const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
      for(const geometry of geometries)geometry.dispose();
    }
  }

  for(let level=0;level<3;level++) {
    const floor=new THREE.Group();floor.name=`${level+1}层`;root.add(floor);layers.push(floor);
    const y=finish+level*storey;
    // Main floor slab leaves the central balcony/porch in the same measured envelope.
    b(12,.16,15,0,y-.08,0,stone,floor);
    for(const sx of [-1,1]) {
      facadePanel(floor,sx*4.3,7.39,3.4,y,0);
      facadePanel(floor,sx*4.03,-7.39,3.72,y,Math.PI);
      for(const zz of [-4.87,0,4.87]) facadePanel(floor,sx*5.89,zz,4.87,y,sx*Math.PI/2);
      // Return wall at each side of the recessed central entrance/balcony.
      b(.20,3.08,1.49,sx*2.65,y+1.54,6.63,cream,floor);
      // Pilasters terminate within the 12-metre frontage.
      for(const px of [sx*5.77,sx*2.76]) {
        b(.27,3.05,.105,px,y+1.53,7.455,molding,floor);
        b(.33,.13,.15,px,y+.15,7.42,cream,floor);
        b(.35,.15,.15,px,y+2.93,7.42,cream,floor);
      }
      wallLamp(floor,sx*2.72,y+2.21,7.51);
      wallLamp(floor,sx*5.77,y+1.71,7.51);
      // Side trim and restrained shadow grooves continue around the corners.
      b(.14,.19,14.96,sx*5.92,y+3.15,0,molding,floor);
      b(.11,.055,14.96,sx*5.945,y+.30,0,molding,floor);
      b(3.38,.19,.16,sx*4.3,y+3.15,7.42,molding,floor);
      ceilingLamp(floor,sx*4.2,y+3.06,7.10);
    }
    facadePanel(floor,0,5.92,5.18,y,0,true,true);
    facadePanel(floor,0,-7.39,4.34,y,Math.PI);
    b(11.96,.19,.15,0,y+3.15,-7.42,molding,floor);
    b(5.18,.16,.20,0,y+3.09,7.39,cream,floor);
    b(5.2,.08,.22,0,y+3.21,7.37,molding,floor);
    if(level>0) balcony(floor,y);
    else {
      // Flush threshold: no entrance steps for the elders' everyday route.
      b(5.1,.04,1.50,0,y-.02,6.73,stone,floor);
      for(const sx of [-1,1]) planter(floor,sx*2.10,y+.03,6.77);
    }
    if(level>0) for(const sx of [-1,1]) planter(floor,sx*1.98,y+.06,6.56,true);
    for(const xx of [-1.65,0,1.65]) ceilingLamp(floor,xx,y+3.035,6.83);
    furnishings(floor,y,level);
    compact(floor);
    // Keep this separate from the merged facade so cutaway reveals the rooms.
    const ceiling=b(12,.22,15,0,y+3.19,0,cream,floor);
    ceilings.push(ceiling);
  }

  function hipRoof(parent,w,d,px,pz,eave,rise) {
    const hw=w/2,hd=d/2,ridge=Math.max(.15,hw-Math.min(d*.35,w*.28));
    const a=[px-hw,eave,pz+hd],bb=[px+hw,eave,pz+hd],cc=[px+hw,eave,pz-hd],dd=[px-hw,eave,pz-hd];
    const l=[px-ridge,eave+rise,pz],r=[px+ridge,eave+rise,pz];
    const positions=[],uv=[];
    for(const tri of [[a,bb,r],[a,r,l],[bb,cc,r],[cc,l,r],[cc,dd,l],[dd,a,l]]) {
      for(const p of tri) {positions.push(...p);uv.push(p[0],p[2]);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,roofMat);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
    b(w,.14,d,px,eave-.13,pz,charcoal,parent);
    b(w-.12,.055,d-.12,px,eave-.223,pz,molding,parent);
    b(ridge*2+.08,.085,.13,px,eave+rise+.02,pz,charcoal,parent);
    // Fine slate joints follow all four pitched planes, batched in one geometry.
    const lines=[];
    const height=(xx,zz)=>eave+.016+rise*Math.max(0,Math.min(1,(hd-Math.abs(zz))/hd,(hw-Math.abs(xx))/(hw-ridge)));
    for(let xx=-hw+.17;xx<hw;xx+=.28) {
      for(let zz=-hd;zz<hd-.01;zz+=.32) {
        const ze=Math.min(hd,zz+.32);lines.push(px+xx,height(xx,zz),pz+zz,px+xx,height(xx,ze),pz+ze);
      }
    }
    for(let zz=-hd+.36;zz<hd;zz+=.44) for(let xx=-hw;xx<hw-.01;xx+=.6) {
      const xe=Math.min(hw,xx+.6);lines.push(px+xx,height(xx,zz),pz+zz,px+xe,height(xe,zz),pz+zz);
    }
    const joints=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(lines,3)),new THREE.LineBasicMaterial({color:'#687074',transparent:true,opacity:.27}));parent.add(joints);
  }
  hipRoof(roof,13.10,16.10,0,0,.24,.90);
  // Raised central roof echoes the reference without temple ornaments or upturns.
  b(5.5,.50,4.0,0,.30,5.63,cream,roof);
  b(5.1,.29,.12,0,.36,7.68,charcoal,roof);
  b(4.88,.21,.045,0,.36,7.76,stone,roof);
  hipRoof(roof,6.36,5.24,0,5.40,.93,.63);
  for(const px of [-2.1,0,2.1]) ceilingLamp(roof,px,.70,7.61,.08);
  for(const sx of [-1,1]) for(const zz of [-5.3,-1.4,2.5,6.2]) ceilingLamp(roof,sx*6.07,-.007,zz);
  compact(roof);

  // Two lights only; all the other architectural fixtures are emissive surfaces.
  const porchLight=new THREE.PointLight('#ffd6a0',0,10,2);porchLight.position.set(0,2.85,6.78);root.add(porchLight);lamps.push(porchLight);
  const upperLight=new THREE.PointLight('#ffd7a5',0,11,2);upperLight.position.set(0,8.9,6.8);root.add(upperLight);lamps.push(upperLight);
  let floorCount=3;
  function setFloors(n=3,exterior=true) {
    floorCount=Math.max(1,Math.min(3,Math.round(n)));
    layers.forEach((layer,i)=>{layer.visible=i<floorCount;});
    ceilings.forEach((ceiling,i)=>{ceiling.visible=exterior || i<floorCount-1;});
    roof.position.y=finish+floorCount*storey;
    roof.visible=exterior;
    upperLight.visible=floorCount>1;
    upperLight.position.y=finish+(floorCount-1)*storey+2.3;
  }
  function setLight(dusk=false,rain=false) {
    glow.emissiveIntensity=dusk?2.3:rain?.7:.16;
    glass.emissive.set('#cd985c');glass.emissiveIntensity=dusk?.055:.0;
    lamps.forEach(light=>{light.intensity=dusk?24:rain?4:0;});
    roofMat.roughness=rain?.54:.95;
    stone.roughness=rain?.49:.72;
  }
  // Rotate the finished residence as one object, including openings and balconies.
  root.rotation.y=rotation;
  root.updateMatrixWorld(true);
  setFloors(3,true);setLight(false,false);
  return { root, setFloors, setLight, update() {}, footprint:180, width:12, depth:15, finishHeight:finish, height:11.71 };
}
