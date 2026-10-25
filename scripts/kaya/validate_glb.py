"""Validate EDUCA's local character without any third-party Python package."""
import argparse
import json
import math
import struct
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('file', type=Path)
args=p.parse_args()
raw=args.file.read_bytes()
magic,version,length=struct.unpack_from('<III',raw)
assert magic==0x46546c67 and version==2 and length==len(raw),'Invalid GLB header'
size,kind=struct.unpack_from('<II',raw,12)
assert kind==0x4e4f534a
g=json.loads(raw[20:20+size])
offset=20+size
bin_size,bin_kind=struct.unpack_from('<II',raw,offset)
assert bin_kind==0x004e4942
data=raw[offset+8:offset+8+bin_size]
assert not g.get('extensionsRequired'),'The asset must not require a remote decoder'
assert all(not image.get('uri') for image in g.get('images',[])),'Images must be embedded'
assert all(not buffer.get('uri') for buffer in g['buffers']),'Buffers must be embedded'

formats={5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}
widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def accessor(index):
    a=g['accessors'][index];view=g['bufferViews'][a['bufferView']]
    fmt,step=formats[a['componentType']];width=widths[a['type']]
    start=view.get('byteOffset',0)+a.get('byteOffset',0)
    stride=view.get('byteStride',width*step)
    out=[struct.unpack_from('<'+fmt*width,data,start+i*stride) for i in range(a['count'])]
    if a.get('normalized'):
        maximum={5121:255,5123:65535}[a['componentType']]
        out=[tuple(v/maximum for v in row) for row in out]
    assert all(math.isfinite(v) for row in out for v in row),'Non-finite geometry/animation data'
    return out

assert len(g.get('skins',[]))==1,'A real shared skin is required'
skin=g['skins'][0]
assert len(skin['joints'])==14
assert len(accessor(skin['inverseBindMatrices']))==14
clips={a['name']:a for a in g.get('animations',[])}
expected={'idle','greeting','attentive','speaking','helping','encouraging','celebrating','resting'}
assert set(clips)==expected,(set(clips),expected)
triangles=vertices=weighted=0
for mesh in g['meshes']:
    for primitive in mesh['primitives']:
        attributes=primitive['attributes']
        positions=accessor(attributes['POSITION']);vertices+=len(positions)
        triangles+=(len(accessor(primitive['indices'])) if 'indices' in primitive else len(positions))//3
        assert 'JOINTS_0' in attributes and 'WEIGHTS_0' in attributes,mesh['name']
        for joints,weights in zip(accessor(attributes['JOINTS_0']),accessor(attributes['WEIGHTS_0'])):
            assert all(0<=int(j)<14 for j in joints)
            assert all(w>=0 for w in weights)
            assert abs(sum(weights)-1)<.001
            weighted+=1
durations={}
for name,clip in clips.items():
    assert clip['channels']
    durations[name]=max(accessor(s['input'])[-1][0] for s in clip['samplers'])
    assert durations[name]>1
    assert any(c['target']['path']=='weights' for c in clip['channels']),name+' has no facial morph track'
greeting=clips['greeting']
assert any(
    len(set(accessor(greeting['samplers'][c['sampler']]['output'])))>3
    for c in greeting['channels']
    if 'upperarm.R' in g['nodes'][c['target']['node']].get('name','')
), 'The greeting must move an actual paw, not only contain empty keyframes'
assert triangles<50000,triangles
assert len(raw)<2*1024*1024,len(raw)
print(json.dumps({'file':str(args.file),'bytes':len(raw),'skins':1,'joints':14,
 'triangles':triangles,'exportedVertices':vertices,'weightedVertices':weighted,
 'clipsSeconds':durations,'embeddedImages':len(g.get('images',[]))},indent=2))
