#!/usr/bin/env python3
"""Extract every slide of lessons 2-10 into a positioned-text canvas JSON so the
web can reproduce the deck exactly (sizes, colours, spacing, images)."""
import os, re, json, glob, shutil
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser("~/Desktop/new MM")
PUB = os.path.join(ROOT, "app", "public", "teach")

A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": A, "p": P, "r": R}


def q(tag):
    pfx, local = tag.split(":")
    return f"{{{A if pfx=='a' else P if pfx=='p' else R}}}{local}"


THEME = {}

def color_of(el):
    if el is None:
        return None
    c = el.find(".//a:srgbClr", NS)
    if c is not None:
        return "#" + c.get("val")
    sc = el.find(".//a:schemeClr", NS)
    if sc is not None:
        return THEME.get(sc.get("val"))
    return None


def emu(v):
    return round(int(v) / 9525, 2)


def xfrm_of(el):
    x = el.find(".//a:xfrm", NS)
    if x is None:
        return None
    off, ext = x.find("a:off", NS), x.find("a:ext", NS)
    if off is None or ext is None:
        return None
    return {"x": emu(off.get("x")), "y": emu(off.get("y")), "w": emu(ext.get("cx")), "h": emu(ext.get("cy")),
            "rot": int(x.get("rot", "0")) / 60000.0}


def para_data(p, default_sz=None):
    pPr = p.find("a:pPr", NS)
    algn = pPr.get("algn") if pPr is not None else None
    marL = int(pPr.get("marL", "0")) / 9525 if pPr is not None else 0
    indent = int(pPr.get("indent", "0")) / 9525 if pPr is not None else 0
    bullet = None
    if pPr is not None:
        bc = pPr.find("a:buChar", NS)
        bn = pPr.find("a:buNone", NS)
        ba = pPr.find("a:buAutoNum", NS)
        if bc is not None:
            bullet = bc.get("char")
        elif ba is not None:
            bullet = "auto"
        elif bn is not None:
            bullet = None
    space = {}
    if pPr is not None:
        for key, tag in (("before", "a:spcBef"), ("after", "a:spcAft")):
            s = pPr.find(tag, NS)
            if s is not None:
                pts = s.find(".//a:spcPts", NS)
                if pts is not None:
                    space[key] = round(int(pts.get("val")) / 100, 2)
                pct = s.find(".//a:spcPct", NS)
                if pct is not None:
                    space[key] = round(int(pct.get("val")) / 1000, 2)
        ln = pPr.find("a:lnSpc", NS)
        if ln is not None:
            pct = ln.find(".//a:spcPct", NS)
            if pct is not None:
                space["line"] = round(int(pct.get("val")) / 100000, 3)
    runs = []
    for node in p:
        tag = node.tag.split("}")[1]
        if tag == "r":
            t = node.find("a:t", NS)
            if t is None or not t.text:
                continue
            rPr = node.find("a:rPr", NS)
            runs.append({
                "t": t.text,
                "sz": int(rPr.get("sz")) / 100 if rPr is not None and rPr.get("sz") else None,
                "b": rPr is not None and rPr.get("b") == "1",
                "i": rPr is not None and rPr.get("i") == "1",
                "color": color_of(rPr) if rPr is not None else None,
            })
        elif tag == "br":
            runs.append({"t": "\n"})
        elif tag == "fld":
            t = node.find("a:t", NS)
            if t is not None and t.text:
                runs.append({"t": t.text})
    if not runs:
        return None
    def_sz = None
    if pPr is not None:
        dr = pPr.find("a:defRPr", NS)
        if dr is not None and dr.get("sz"):
            def_sz = int(dr.get("sz")) / 100
        epr = pPr.find("a:endParaRPr", NS)
        if epr is not None and epr.get("sz") and not def_sz:
            def_sz = int(epr.get("sz")) / 100
    return {"algn": algn, "marL": marL, "indent": indent, "bullet": bullet, "space": space, "runs": runs,
            "defSz": def_sz or default_sz}


def text_shape(sp):
    x = xfrm_of(sp)
    if x is None:
        return None
    body = sp.find(".//p:txBody", NS)
    if body is None:
        return None
    bodyPr = body.find("a:bodyPr", NS)
    anchor = bodyPr.get("anchor") if bodyPr is not None else None
    ins = {k: emu(bodyPr.get(k, d)) if bodyPr is not None and bodyPr.get(k) else emu(d)
           for k, d in (("lIns", "91440"), ("rIns", "91440"), ("tIns", "45720"), ("bIns", "45720"))}
    scale = 1.0
    if bodyPr is not None:
        na = bodyPr.find("a:normAutofit", NS)
        if na is not None and na.get("fontScale"):
            scale = int(na.get("fontScale")) / 100000
    body_sz = None
    ls = body.find("a:lstStyle", NS)
    if ls is not None:
        lv = ls.find("a:lvl1pPr", NS)
        if lv is not None and lv.find("a:defRPr", NS) is not None and lv.find("a:defRPr", NS).get("sz"):
            body_sz = int(lv.find("a:defRPr", NS).get("sz")) / 100
    paras = []
    for p in body.findall("a:p", NS):
        d = para_data(p, body_sz)
        if d:
            paras.append(d)
    if not paras:
        return None
    spPr = sp.find("p:spPr", NS)
    fill = color_of(spPr.find("a:solidFill", NS)) if spPr is not None else None
    line = None
    if spPr is not None:
        ln = spPr.find("a:ln", NS)
        if ln is not None and ln.find("a:solidFill", NS) is not None:
            line = {"color": color_of(ln), "w": round(int(ln.get("w", "12700")) / 9525, 2)}
    return {"type": "text", "x": x["x"], "y": x["y"], "w": x["w"], "h": x["h"], "rot": x.get("rot", 0),
            "anchor": anchor, "ins": ins, "fill": fill, "line": line, "paras": paras, "scale": scale}


def walk(el, shapes, rels, media_dir, slide_no, counter, tx=0, ty=0, sx=1.0, sy=1.0):
    for child in el:
        tag = child.tag.split("}")[1]
        if tag == "grpSp":
            gx = xfrm_of(child)
            off = child.find(".//a:chOff", NS)
            ext = child.find(".//a:chExt", NS)
            gsx = gsy = 1.0
            if off is not None and ext is not None:
                gsx = float(ext.get("cx")) / max(1, float(off.get("cx", ext.get("cx"))))
                gsy = float(ext.get("cy")) / max(1, float(off.get("cy", ext.get("cy"))))
            walk(child, shapes, rels, media_dir, slide_no, counter,
                 tx + (gx["x"] if gx else 0) * sx, ty + (gx["y"] if gx else 0) * sy, sx * gsx, sy * gsy)
        elif tag == "sp":
            s = text_shape(child)
            if s:
                if tx or ty:
                    s["x"] = round(s["x"] * sx + tx, 2)
                    s["y"] = round(s["y"] * sy + ty, 2)
                shapes.append(s)
        elif tag == "pic":
            x = xfrm_of(child)
            blip = child.find(".//a:blip", NS)
            if x is None or blip is None:
                continue
            rid = blip.get(f"{{{R}}}embed")
            target = rels.get(rid)
            if not target:
                continue
            src = os.path.normpath(os.path.join(os.path.dirname(target), target)) if False else target
            media = os.path.join(os.path.dirname(media_dir[0]), "media", os.path.basename(target)) if False else None
            fname = f"s{slide_no}_{counter[0]}{os.path.splitext(target)[1]}"
            counter[0] += 1
            try:
                shutil.copyfile(media_dir[1][target], os.path.join(media_dir[0], fname))
            except Exception:
                continue
            shapes.append({"type": "image", "x": x["x"], "y": x["y"], "w": x["w"], "h": x["h"],
                           "src": f"/teach/{media_dir[2]}/canvas/{fname}"})


def main():
    files = {}
    for f in glob.glob(os.path.join(SRC, "*.pptx")):
        m = re.search(r"L(\d\d)", os.path.basename(f))
        if m and 2 <= int(m.group(1)) <= 10:
            files[int(m.group(1))] = f
    for lesson, path in sorted(files.items()):
        import zipfile
        z = zipfile.ZipFile(path)
        pres = ET.fromstring(z.read("ppt/presentation.xml"))
        rels_xml = ET.fromstring(z.read("ppt/_rels/presentation.xml.rels"))
        rels = {r.get("Id"): r.get("Target") for r in rels_xml}
        order = []
        for sid in pres.find("p:sldIdLst", NS):
            rid = sid.get(f"{{{R}}}id")
            target = rels.get(rid, "")
            m = re.search(r"slide(\d+)\.xml", target)
            if m:
                order.append(m.group(1))
        # theme palette
        global THEME
        THEME = {}
        try:
            th = ET.fromstring(z.read("ppt/theme/theme1.xml"))
            for slot in th.findall(".//a:clrScheme/*", NS):
                name = slot.tag.split("}")[1]
                c = slot.find("a:srgbClr", NS)
                if c is not None:
                    THEME[name] = "#" + c.get("val")
            THEME["tx1"] = THEME.get("dk1", "#000000")
            THEME["tx2"] = THEME.get("dk2", "#000000")
            THEME["bg1"] = THEME.get("lt1", "#FFFFFF")
            THEME["bg2"] = THEME.get("lt2", "#FFFFFF")
        except KeyError:
            pass
        out_dir = os.path.join(PUB, f"l{lesson:02d}", "canvas")
        os.makedirs(out_dir, exist_ok=True)
        slides = {}
        for idx, sid in enumerate(order, start=1):
            num = int(sid)
            if num > 100:
                continue
            xml = ET.fromstring(z.read(f"ppt/slides/slide{sid}.xml"))
            # relationships for pictures
            try:
                srels = ET.fromstring(z.read(f"ppt/slides/_rels/slide{sid}.xml.rels"))
                rel_map = {r.get("Id"): r.get("Target") for r in srels}
            except KeyError:
                rel_map = {}
            media_files = {}
            for rid, target in rel_map.items():
                if target.startswith("../media/"):
                    media_files[target] = os.path.join(os.path.dirname(z.filename) if hasattr(z, 'filename') else os.path.dirname(path), "ppt", target.replace("../", ""))
                    media_files[target] = path  # marker, replaced below
            # paths inside zip
            media_map = {t: os.path.join(os.path.dirname(path) + "/", "unused") for t in media_files}
            shapes = []
            spTree = xml.find(".//p:cSld/p:spTree", NS)
            # custom walker with zip extraction
            def walk2(el, tx=0, ty=0, sx=1.0, sy=1.0):
                for child in el:
                    tag = child.tag.split("}")[1]
                    if tag == "grpSp":
                        gx = xfrm_of(child)
                        off = child.find(".//a:chOff", NS)
                        ext = child.find(".//a:chExt", NS)
                        gsx = gsy = 1.0
                        if off is not None and ext is not None:
                            gsx = float(ext.get("cx")) / max(1, float(off.get("cx", ext.get("cx"))))
                            gsy = float(ext.get("cy")) / max(1, float(off.get("cy", ext.get("cy"))))
                        walk2(child, tx + (gx["x"] if gx else 0) * sx, ty + (gx["y"] if gx else 0) * sy, sx * gsx, sy * gsy)
                    elif tag == "sp":
                        s = text_shape(child)
                        if s:
                            if tx or ty or sx != 1.0 or sy != 1.0:
                                s["x"] = round(s["x"] * sx + tx, 2)
                                s["y"] = round(s["y"] * sy + ty, 2)
                                s["w"] = round(s["w"] * sx, 2)
                                s["h"] = round(s["h"] * sy, 2)
                            shapes.append(s)
                        else:
                            x = xfrm_of(child)
                            spPr = child.find("p:spPr", NS)
                            if x and spPr is not None:
                                fill = color_of(spPr.find("a:solidFill", NS))
                                ln = spPr.find("a:ln", NS)
                                line = None
                                if ln is not None and ln.find("a:solidFill", NS) is not None:
                                    line = {"color": color_of(ln), "w": round(int(ln.get("w", "12700")) / 9525, 2)}
                                geom = spPr.find("a:prstGeom", NS)
                                if fill or line:
                                    shapes.append({"type": "box", "x": round(x["x"] * sx + tx, 2), "y": round(x["y"] * sy + ty, 2),
                                                   "w": round(x["w"] * sx, 2), "h": round(x["h"] * sy, 2),
                                                   "fill": fill, "line": line, "radius": 10 if geom is not None and geom.get("prst") == "roundRect" else 0,
                                                   "alpha": None})
                    elif tag == "pic":
                        x = xfrm_of(child)
                        blip = child.find(".//a:blip", NS)
                        if x is None or blip is None:
                            continue
                        rid = blip.get(f"{{{R}}}embed")
                        target = rel_map.get(rid)
                        if not target:
                            continue
                        fname = f"s{num}_{len([s for s in shapes if s['type']=='image'])}{os.path.splitext(target)[1]}"
                        try:
                            data = z.read("ppt/" + target.replace("../", ""))
                            open(os.path.join(out_dir, fname), "wb").write(data)
                        except Exception:
                            continue
                        shapes.append({"type": "image", "x": x["x"], "y": x["y"], "w": x["w"], "h": x["h"],
                                       "src": f"/teach/l{lesson:02d}/canvas/{fname}"})
            if spTree is not None:
                walk2(spTree)
            bg = None
            b = xml.find(".//p:bg//a:srgbClr", NS)
            if b is not None:
                bg = "#" + b.get("val")
            slides[str(num)] = {"bg": bg, "shapes": shapes}
        json.dump({"w": 1280, "h": 720, "slides": slides}, open(os.path.join(PUB, f"l{lesson:02d}", "canvas.json"), "w"),
                  ensure_ascii=False, separators=(",", ":"))
        print(f"L{lesson:02d}: {len(slides)} slides, {os.path.getsize(os.path.join(PUB, f'l{lesson:02d}', 'canvas.json'))//1024}KB")


if __name__ == "__main__":
    main()
