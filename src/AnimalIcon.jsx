import React from 'react';

// Silhuetas vetoriais próprias: proporções e sinais variam com a categoria.
const profiles={
  Bezerra:{tone:'calf',body:'M17 25 Q17 19 24 19 H37 Q44 19 45 26 L43 34 H22 Q17 33 17 25Z',legs:'M21 32 L20 45 H24 L26 32 M36 32 L37 45 H41 L40 31',head:'M40 22 L44 13 L51 14 L55 23 L52 29 L44 28Z'},
  Desmame:{tone:'weaned',body:'M13 23 Q13 17 23 17 H38 Q45 18 46 26 L43 35 H20 Q13 33 13 23Z',legs:'M18 32 L17 45 H21 L24 32 M35 32 L36 45 H40 L40 31',head:'M40 21 L44 12 L52 14 L56 23 L53 28 L45 27Z'},
  Novilha:{tone:'heifer',body:'M10 22 Q11 16 21 16 H38 Q44 16 46 25 L43 33 H18 Q10 32 10 22Z',legs:'M15 30 L14 45 H18 L22 30 M35 30 L36 45 H40 L40 29',head:'M40 22 L44 12 H51 L56 22 L54 27 L45 26Z'},
  Gestante:{tone:'pregnant',body:'M9 22 Q10 15 21 16 H37 Q46 17 46 25 Q44 40 27 38 Q12 37 9 28Z',legs:'M14 30 L13 45 H18 L21 31 M36 31 L36 45 H41 L41 30',head:'M40 22 L43 12 H51 L56 22 L54 27 L45 26Z'},
  Lactação:{tone:'milking',body:'M9 22 Q10 15 21 16 H37 Q45 16 46 25 L43 34 H19 Q9 33 9 22Z',legs:'M14 30 L13 45 H18 L21 31 M36 31 L36 45 H41 L41 30',head:'M40 22 L43 12 H51 L56 22 L54 27 L45 26Z'},
  Seca:{tone:'dry',body:'M9 21 Q11 14 23 15 H37 Q46 16 46 25 L43 35 H20 Q9 34 9 21Z',legs:'M15 31 L14 45 H19 L22 31 M36 31 L36 45 H41 L41 30',head:'M40 22 L43 12 H51 L56 22 L54 27 L45 26Z'}
};

export default function AnimalIcon({stage,size=24,className='',...props}){
  const p=profiles[stage]||profiles.Seca;
  return <svg viewBox="0 0 64 56" width={size} height={size} className={'cow-silhouette '+p.tone+' '+className} role="img" aria-label={stage?'Bovino — '+stage:'Vaca'} {...props}>
    <g fill="currentColor">
      <path d={p.body}/><path d={p.legs}/><path d={p.head}/>
      <path d="M44 15 Q37 10 37 15 L43 20 M50 15 Q58 10 59 15 L53 20"/>
      {!['Bezerra','Desmame'].includes(stage)&&<path d="M44 13 Q40 9 43 6 L47 13 M49 13 Q52 9 51 6 Q57 9 52 15"/>}
      {stage==='Lactação'&&<path d="M24 32 Q23 40 29 40 H33 Q38 39 36 32Z M27 38 H29 V44 H27Z M32 38 H34 V44 H32Z"/>}
      <path d={stage==='Bezerra'?'M18 22 Q10 20 11 29 L8 32 L9 25 Q10 17 18 20Z':'M12 21 Q6 19 7 32 L4 36 L4 30 Q4 14 13 18Z'}/>
    </g>
    <circle cx="50" cy="19" r="1.2" fill="var(--cow-eye,#fff)"/>
    {stage==='Bezerra'&&<path d="M29 15 V8 M25 11 L29 15 L33 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}
    {stage==='Desmame'&&<path d="M25 10 L29 6 L33 10 M25 14 L29 10 L33 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {stage==='Novilha'&&<path d="M23 9 Q26 2 31 4 Q32 9 23 9Z" fill="currentColor"/>}
    {stage==='Gestante'&&<path d="M25 25 C20 21 18 28 25 32 C32 28 30 21 25 25Z" fill="var(--cow-eye,#fff)"/>}
    {stage==='Lactação'&&<path d="M58 33 Q50 42 58 44 Q65 42 58 33Z" fill="currentColor"/>}
    {stage==='Seca'&&<g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M54 36 V43 M59 36 V43"/></g>}
    {stage==='Vendido'&&<path d="M50 39 H61 M57 35 L61 39 L57 43" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {stage==='Óbito'&&<path d="M54 34 V44 M50 38 H58" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}
  </svg>;
}
