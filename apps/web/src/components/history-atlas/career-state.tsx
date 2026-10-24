'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { atlasId } from './model';
/** The server renders a complete GET fallback. Keep its links in sync with live map selection. */
export function CareerState({children}:{children:ReactNode}) {
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const sync=()=>{
      const selected=new URL(location.href).searchParams.get('selected');
      for(const link of root.current?.querySelectorAll<HTMLAnchorElement>('[data-career-page]')??[]) {
        const url=new URL(link.href);
        if(atlasId(selected)) url.searchParams.set('selected',selected); else url.searchParams.delete('selected');
        link.href=url.pathname+url.search+url.hash;
      }
      const field=root.current?.querySelector<HTMLInputElement>('input[name=selected]');
      if(field) {field.value=atlasId(selected)?selected:'';field.disabled=!atlasId(selected);}
    };
    sync();window.addEventListener('atlas-selection',sync);window.addEventListener('popstate',sync);
    return()=>{window.removeEventListener('atlas-selection',sync);window.removeEventListener('popstate',sync);};
  },[]);
  return <div ref={root}>{children}</div>;
}
