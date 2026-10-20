#!/usr/bin/env python3
"""Render a self-contained PRIVATE 1988 Senna/Prost editorial preview."""
import argparse
import html
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LEDGER=ROOT/"docs/editorial/research-pack-2026-10/season-1988-duel-results.json"
TEMPLATE=ROOT/"docs/editorial/research-pack-2026-10/duel-preview.template.html"
def payload(data):
    races=data.get("races",[])
    if len(races)!=16 or [r.get("round") for r in races]!=list(range(1,17)):
        raise ValueError("expected exactly 16 ordered races")
    series=[]
    history={"senna":[],"prost":[]}
    for race in races:
        row={"round":race["round"],"race":race["grand_prix"],"driver":{}}
        for k in ("senna","prost"):
            d=race[k]
            value=d.get("listed_points")
            if type(value) is not int or not 0<=value<=9:raise ValueError("invalid race points")
            history[k].append(value)
            row["driver"][k]={"position":d["race_position"],"racePoints":value,"raw":sum(history[k]),"counted":sum(sorted(history[k],reverse=True)[:11])}
        series.append(row)
    if [series[-1]["driver"][k]["counted"] for k in ("senna","prost")]!=[90,87]:
        raise ValueError("official standings mismatch")
    return {"status":"INTERNAL RESEARCH — NOT APPROVED FOR PUBLICATION","publicationAllowed":False,"sourceLinks":{"senna":"https://www.formula1.com/en/results/1988/drivers/AYRSEN01/ayrton-senna","prost":"https://www.formula1.com/en/results/1988/drivers/ALAPRO01/alain-prost","official":"https://www.formula1.com/en/results/1988/drivers"},"series":series}
def render(data,template):
    value=payload(data)
    safe_json=json.dumps(value,ensure_ascii=False,separators=(",",":")).replace("<","\\u003c").replace(">","\\u003e").replace("&","\\u0026")
    if template.count("/*INJECT_DATA*/")==0:raise ValueError("missing injection marker")
    return template.replace("/*INJECT_DATA*/",safe_json)
def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument("--output",required=True,type=Path)
    args=a.parse_args()
    content=render(json.loads(LEDGER.read_text(encoding="utf-8")),TEMPLATE.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(content,encoding="utf-8")
    print("Wrote private UK/EN interactive prototype. This file MUST NOT go into public assets.")
if __name__=="__main__":main()
