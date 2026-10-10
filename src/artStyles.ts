export const artStyles=['liquid','baroque','matchbox','pixel','noir','aero','calendar','brutal','anti','curse','sigil','retro'] as const;
export type ArtStyle=typeof artStyles[number];
export const artSequence:Record<string,ArtStyle[]>={
 selected:['liquid'],trailers:['baroque','noir'],brands:['matchbox','calendar','brutal','aero','anti'],
 'short-form':['pixel','curse','sigil','retro'],youtube:['aero','retro','anti','baroque'],events:['noir','sigil']
};
export const posterCopy:Record<string,string[]>={
 selected:['I set the direction.','Then lead the work.','Research. Brand strategy. Briefs.','Shoot planning. Direction. Teams.','Editing. Graphics. AI / VFX.','Reach. Retention. Review.'],
 trailers:['Audience. Positioning. Release strategy.','Story. Tension. Reveal.','Trailers + teasers.','Edit / VFX / production briefs.','Picture and sound. Working together.'],
 brands:['Research. Positioning. Messaging.','The identity. The campaign.','Scripts. Shoot plans. Team briefs.','Direction / editing / motion / 3D.','Built for the platform. Creative tests.'],
 'short-form':['Audience insight. Scripts. Format tests.','Hook immediately. Hold attention.','Production & shot briefs.','AI / compositing / lip-sync.','Distinctive images. Controlled pacing.'],
 youtube:['Topic research. Format strategy.','Titles. Thumbnails. Production briefs.','The opening hook. The payoff.','Structure. Pacing. Visual identity.','Entertainment / interviews / food.','Retention review.'],
 events:['Audience. Rollout. Production briefs.','Comedy / festivals / live.','Keep the timing. Carry the energy.','Performance. Anticipation. Impact.','Shoot coverage. Editing. Review.']
};
