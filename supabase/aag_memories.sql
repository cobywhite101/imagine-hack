-- Generated from aag_memories.json.
-- Rebuild with: npm run sync:aag

create table if not exists customer_memories (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  kind text not null default 'note',
  title text not null,
  summary text not null,
  body text,
  source_name text,
  source_meta text,
  created_at timestamptz default now()
);

alter table customer_memories add column if not exists body text;

alter table customer_memories enable row level security;
drop policy if exists "public read" on customer_memories;
drop policy if exists "public insert" on customer_memories;
drop policy if exists "public update" on customer_memories;
drop policy if exists "public delete" on customer_memories;
create policy "public read" on customer_memories for select using (true);
create policy "public insert" on customer_memories for insert with check (true);
create policy "public update" on customer_memories for update using (true) with check (true);
create policy "public delete" on customer_memories for delete using (true);

delete from customer_memories where customer_id like 'CL-%' or source_name in ('AAG dataset', 'AAG memory synthesis');

insert into customer_memories (
  id,
  customer_id,
  kind,
  title,
  summary,
  body,
  source_name,
  source_meta,
  created_at
) values
  ('aag-memory-CL-0001', 'CL-0001', 'profile', 'Consolidated client memory', 'Koh Li Wen is a 35-year-old civil engineer, a client since September 2018 (7 years). Married to Jun Wei. Has 2 children: Mei Yee (son, age 13); Wei Ling (son, age 6). Originally a cold outreach contact.', 'Koh Li Wen is a 35-year-old civil engineer, a client since September 2018 (7 years). Married to Jun Wei. Has 2 children: Mei Yee (son, age 13); Wei Ling (son, age 6). Originally a cold outreach contact.

Falls in the RM150k-250k income bracket with an estimated net worth of RM8M+. Risk tolerance is aggressive, investment horizon roughly 16 years. Liabilities: mortgage only. Currently holds: Life (renews June 2027).

Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed September 2025. Last direct contact was November 2025, 203 days ago. He keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '3 source interactions', '2025-11-29'),
  ('aag-memory-CL-0002', 'CL-0002', 'profile', 'Consolidated client memory', 'Goh Li Wen is a 45-year-old secondary school teacher, a client since December 2019 (6 years). Single. Has 1 child: Mei Yee (daughter, age 11). Originally a cold outreach contact.', 'Goh Li Wen is a 45-year-old secondary school teacher, a client since December 2019 (6 years). Single. Has 1 child: Mei Yee (daughter, age 11). Originally a cold outreach contact.

Falls in the RM80k-150k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 8 years. Liabilities: business loan. Currently holds: General Insurance (renews May 2027); Medical (renews June 2026); Life (renews September 2026).

Mentioned in January 2026: Considering a career change.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed January 2025. Last direct contact was January 2026, 150 days ago. He used to play competitive badminton at state level back in school.', 'AAG memory synthesis', '4 source interactions', '2026-01-21'),
  ('aag-memory-CL-0003', 'CL-0003', 'profile', 'Consolidated client memory', 'Ong Jun Wei is a 58-year-old logistics manager, a client since December 2019 (6 years). Married to Pei Shan. Has 2 children: Choon Hong (daughter, age 0); Zhi Hao (son, age 19).', 'Ong Jun Wei is a 58-year-old logistics manager, a client since December 2019 (6 years). Married to Pei Shan. Has 2 children: Choon Hong (daughter, age 0); Zhi Hao (son, age 19).

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 22 years. Liabilities: car loan only. Currently holds: Investment-linked (renews October 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed June 2025. Last direct contact was February 2026, 138 days ago. He plays badminton in a weekly league with old university friends. He is training for a half-marathon later this year, runs most mornings before work.', 'AAG memory synthesis', '3 source interactions', '2026-02-02'),
  ('aag-memory-CL-0004', 'CL-0004', 'profile', 'Consolidated client memory', 'Lim Jia Hao is a 35-year-old medical doctor, a client since July 2023 (2 years). Married to Boon Keat.', 'Lim Jia Hao is a 35-year-old medical doctor, a client since July 2023 (2 years). Married to Boon Keat.

Falls in the RM250k-400k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 21 years. Liabilities: none outstanding. Currently holds: Critical Illness (renews August 2026); Critical Illness (renews December 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed November 2024. Last direct contact was February 2024, 861 days ago. He is into specialty coffee, has strong opinions about pour-over versus espresso. He plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '1 source interactions', '2024-02-10'),
  ('aag-memory-CL-0005', 'CL-0005', 'profile', 'Consolidated client memory', 'Anand a/l Govindasamy is a 46-year-old accountant, a client since June 2019 (7 years). Married to Deepa. Has 3 children: Anitha (daughter, age 12); Meera (daughter, age 13); Ganesh (son, age 1). Acquired through a corporate event.', 'Anand a/l Govindasamy is a 46-year-old accountant, a client since June 2019 (7 years). Married to Deepa. Has 3 children: Anitha (daughter, age 12); Meera (daughter, age 13); Ganesh (son, age 1). Acquired through a corporate event.

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 19 years. Liabilities: mortgage only. Currently holds: Medical (renews June 2026); Life (renews March 2027).

Mentioned in January 2026: Exploring business expansion — expected to become relevant again around August 2026. Mentioned in February 2026: Meera diagnosed with a health condition requiring ongoing care — expected to become relevant again around August 2026. Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed October 2024. Last direct contact was February 2026, 119 days ago. He is a karaoke regular, says it''s the best way to unwind after a long week. He is learning Mandarin in spare time, says it helps with business dealings.', 'AAG memory synthesis', '4 source interactions', '2026-02-21'),
  ('aag-memory-CL-0006', 'CL-0006', 'profile', 'Consolidated client memory', 'Naveen a/l Rajendran is a 64-year-old dentist, a client since December 2025 (1 year). Married to Lakshmi. Has 2 children: Anitha (daughter, age 43); Arun (son, age 3).', 'Naveen a/l Rajendran is a 64-year-old dentist, a client since December 2025 (1 year). Married to Lakshmi. Has 2 children: Anitha (daughter, age 43); Arun (son, age 3).

Falls in the RM150k-250k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 23 years. Liabilities: car loan only. Currently holds: General Insurance (renews December 2026); General Insurance (renews August 2026).

Mentioned in May 2026: Newly promoted, income increasing.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed April 2026. Last direct contact was May 2026, 35 days ago. He plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '4 source interactions', '2026-05-16'),
  ('aag-memory-CL-0007', 'CL-0007', 'profile', 'Consolidated client memory', 'Chong Hui Min is a 61-year-old dentist, a client since March 2025 (1 year). Single. Has 1 child: Kai Xin (son, age 1). Came in through a referral from an existing client.', 'Chong Hui Min is a 61-year-old dentist, a client since March 2025 (1 year). Single. Has 1 child: Kai Xin (son, age 1). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 19 years. Liabilities: business loan. Currently holds: Investment-linked (renews June 2026); Education Savings (renews October 2026); General Insurance (renews October 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed March 2025. Last direct contact was December 2025, 198 days ago. She plays badminton in a weekly league with old university friends. She recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '1 source interactions', '2025-12-04'),
  ('aag-memory-CL-0008', 'CL-0008', 'profile', 'Consolidated client memory', 'Noraini binti Salleh is a 55-year-old software engineer, a client since June 2021 (5 years). Single.', 'Noraini binti Salleh is a 55-year-old software engineer, a client since June 2021 (5 years). Single.

Falls in the RM80k-150k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 12 years. Liabilities: car loan only. Currently holds: Education Savings (renews April 2027); General Insurance (renews September 2026).

Mentioned in December 2025: Newly promoted, income increasing.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed April 2025. Last direct contact was December 2025, 186 days ago. She keeps tropical fish as a hobby, with a fairly elaborate home aquarium setup. She collects vinyl records, mostly 80s Cantopop and jazz.', 'AAG memory synthesis', '2 source interactions', '2025-12-16'),
  ('aag-memory-CL-0009', 'CL-0009', 'profile', 'Consolidated client memory', 'Loh Xin Yi is a 34-year-old management consultant, a client since December 2020 (5 years). Married to Jun Wei. Has 4 children: Su Ann (son, age 14); Mei Ling (daughter, age 12); Wen Jun (daughter, age 8); Pei Shan (daughter, age 9). Came in through a referral from an existing client.', 'Loh Xin Yi is a 34-year-old management consultant, a client since December 2020 (5 years). Married to Jun Wei. Has 4 children: Su Ann (son, age 14); Mei Ling (daughter, age 12); Wen Jun (daughter, age 8); Pei Shan (daughter, age 9). Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 11 years. Liabilities: none outstanding. Currently holds: Critical Illness (renews June 2026).

Mentioned in February 2026: Recently purchased a new home. Mentioned in February 2026: Inherited a sum from a late relative.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed March 2025. Last direct contact was March 2026, 86 days ago. He has a rescue dog that often comes up in conversation.', 'AAG memory synthesis', '5 source interactions', '2026-03-26'),
  ('aag-memory-CL-0010', 'CL-0010', 'profile', 'Consolidated client memory', 'Koh Pei Shan is a 62-year-old entrepreneur, a client since January 2025 (1 year). Married to Yong Jie. Originally a cold outreach contact.', 'Koh Pei Shan is a 62-year-old entrepreneur, a client since January 2025 (1 year). Married to Yong Jie. Originally a cold outreach contact.

Falls in the RM150k-250k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is moderate, investment horizon roughly 7 years. Liabilities: business loan. Currently holds: Investment-linked (renews September 2026).

Mentioned in April 2026: Recently purchased a new home. Mentioned in May 2026: Considering a career change.

Prefers WhatsApp for contact. Has a will in place. Fact-find last completed July 2025. Last direct contact was May 2026, 39 days ago. She plays badminton in a weekly league with old university friends. She keeps tropical fish as a hobby, with a fairly elaborate home aquarium setup.', 'AAG memory synthesis', '5 source interactions', '2026-05-12'),
  ('aag-memory-CL-0011', 'CL-0011', 'profile', 'Consolidated client memory', 'Mohd Hafiz bin Karim is a 56-year-old university lecturer, a client since January 2022 (4 years). Single. Has 1 child: Mohd Syafiq (son, age 19).', 'Mohd Hafiz bin Karim is a 56-year-old university lecturer, a client since January 2022 (4 years). Single. Has 1 child: Mohd Syafiq (son, age 19).

Falls in the RM400k+ income bracket with an estimated net worth of RM3M-8M. Risk tolerance is moderate, investment horizon roughly 24 years. Liabilities: car loan only. Currently holds: Life (renews December 2026); Investment-linked (renews April 2027).

Mentioned in October 2025: Planning to relocate overseas for work — expected to become relevant again around April 2026.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed August 2025. Last direct contact was October 2025, 238 days ago. He has a rescue dog that often comes up in conversation.', 'AAG memory synthesis', '2 source interactions', '2025-10-25'),
  ('aag-memory-CL-0012', 'CL-0012', 'profile', 'Consolidated client memory', 'Senthil a/l Muthu is a 28-year-old lawyer, a client since June 2023 (2 years). Married to Lakshmi. Has 1 child: Priya (daughter, age 7). Acquired through a corporate event.', 'Senthil a/l Muthu is a 28-year-old lawyer, a client since June 2023 (2 years). Married to Lakshmi. Has 1 child: Priya (daughter, age 7). Acquired through a corporate event.

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 10 years. Liabilities: car loan only. Currently holds: Education Savings (renews February 2027).

Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers Email for contact. Has a will in place. Fact-find last completed March 2026. Last direct contact was June 2026, 13 days ago. He enjoys mahjong sessions with extended family during festive seasons.', 'AAG memory synthesis', '4 source interactions', '2026-06-07'),
  ('aag-memory-CL-0013', 'CL-0013', 'profile', 'Consolidated client memory', 'Nurul Ain binti Ismail is a 50-year-old entrepreneur, a client since January 2025 (1 year). Married to Ahmad Faiz. Has 2 children: Iskandar (son, age 3); Aiman Hakim (son, age 2). Came in through a referral from an existing client.', 'Nurul Ain binti Ismail is a 50-year-old entrepreneur, a client since January 2025 (1 year). Married to Ahmad Faiz. Has 2 children: Iskandar (son, age 3); Aiman Hakim (son, age 2). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 16 years. Liabilities: none outstanding. Currently holds: Education Savings (renews December 2026); Education Savings (renews December 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed August 2025. Last direct contact was April 2025, 445 days ago. She is a board game enthusiast, hosts a regular games night at home. She keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '2 source interactions', '2025-04-01'),
  ('aag-memory-CL-0014', 'CL-0014', 'profile', 'Consolidated client memory', 'Goh Choon Hong is a 49-year-old university lecturer, a client since July 2022 (3 years). Married to Mei Yee.', 'Goh Choon Hong is a 49-year-old university lecturer, a client since July 2022 (3 years). Married to Mei Yee.

Falls in the RM250k-400k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 21 years. Liabilities: car loan only. Currently holds: Investment-linked (renews May 2027); Education Savings (renews January 2027).

Mentioned in April 2026: Planning early retirement — expected to become relevant again around April 2027.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed December 2025. Last direct contact was April 2026, 61 days ago. He is a keen amateur photographer, mostly street photography around the city on weekends. He is a karaoke regular, says it''s the best way to unwind after a long week.', 'AAG memory synthesis', '2 source interactions', '2026-04-20'),
  ('aag-memory-CL-0015', 'CL-0015', 'profile', 'Consolidated client memory', 'Nor Azlina binti Aziz is a 26-year-old lawyer, a client since May 2021 (5 years). Married to Mohd Syafiq. Has 1 child: Nasrul (son, age 6). Came in through a referral from an existing client.', 'Nor Azlina binti Aziz is a 26-year-old lawyer, a client since May 2021 (5 years). Married to Mohd Syafiq. Has 1 child: Nasrul (son, age 6). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 14 years. Liabilities: none outstanding. Currently holds: Life (renews September 2026); Critical Illness (renews May 2027).

Mentioned in November 2025: Nasrul diagnosed with a health condition requiring ongoing care — expected to become relevant again around February 2026.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed April 2025. Last direct contact was November 2025, 223 days ago. She is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '2 source interactions', '2025-11-09'),
  ('aag-memory-CL-0016', 'CL-0016', 'profile', 'Consolidated client memory', 'Sim Mei Yee is a 37-year-old staff nurse, a client since November 2020 (5 years). Single. Has 3 children: Wei Ling (daughter, age 10); Shu Fen (daughter, age 9); Kai Xin (daughter, age 4). Came in through a referral from an existing client.', 'Sim Mei Yee is a 37-year-old staff nurse, a client since November 2020 (5 years). Single. Has 3 children: Wei Ling (daughter, age 10); Shu Fen (daughter, age 9); Kai Xin (daughter, age 4). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 10 years. Liabilities: none outstanding. Currently holds: Critical Illness (renews June 2026); Critical Illness (renews April 2027); Life (renews July 2026).

Mentioned in May 2026: Newly promoted, income increasing.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed August 2024. Last direct contact was May 2026, 22 days ago. He is a karaoke regular, says it''s the best way to unwind after a long week.', 'AAG memory synthesis', '4 source interactions', '2026-05-29'),
  ('aag-memory-CL-0017', 'CL-0017', 'profile', 'Consolidated client memory', 'Lim Choon Hong is a 44-year-old university lecturer, a client since February 2021 (5 years). Has 1 child: Zhi Hao (son, age 10). Came in through a referral from an existing client.', 'Lim Choon Hong is a 44-year-old university lecturer, a client since February 2021 (5 years). Has 1 child: Zhi Hao (son, age 10). Came in through a referral from an existing client.

Falls in the RM150k-250k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 16 years. Liabilities: none outstanding. Currently holds: Medical (renews July 2026).

Mentioned in December 2025: Zhi Hao diagnosed with a health condition requiring ongoing care — expected to become relevant again around July 2026. Mentioned in March 2026: Planning to relocate overseas for work — expected to become relevant again around January 2027. Also worth noting (preference): Prefers WhatsApp over email, says she rarely checks email outside work hours.

Prefers Phone call for contact. Has a will in place. Fact-find last completed April 2026. Last direct contact was March 2026, 100 days ago. She keeps tropical fish as a hobby, with a fairly elaborate home aquarium setup.', 'AAG memory synthesis', '5 source interactions', '2026-03-12'),
  ('aag-memory-CL-0018', 'CL-0018', 'profile', 'Consolidated client memory', 'Loh Boon Keat is a 52-year-old it project manager, a client since December 2018 (7 years). Single. Has 1 child: Su Ann (daughter, age 12). Originally a cold outreach contact.', 'Loh Boon Keat is a 52-year-old it project manager, a client since December 2018 (7 years). Single. Has 1 child: Su Ann (daughter, age 12). Originally a cold outreach contact.

Falls in the RM250k-400k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 12 years. Liabilities: business loan. Currently holds: Medical (renews July 2026).

Mentioned in September 2025: Inherited a sum from a late relative. Also worth noting (preference): Prefers WhatsApp over email, says she rarely checks email outside work hours.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed August 2025. Last direct contact was December 2025, 193 days ago. She is into specialty coffee, has strong opinions about pour-over versus espresso. She plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '3 source interactions', '2025-12-09'),
  ('aag-memory-CL-0019', 'CL-0019', 'profile', 'Consolidated client memory', 'Hisyam bin Ismail is a 52-year-old pharmacist, a client since July 2025 (1 year). Divorced. Has 2 children: Nasrul (son, age 14); Nurul Ain (daughter, age 19). Came in through a referral from an existing client.', 'Hisyam bin Ismail is a 52-year-old pharmacist, a client since July 2025 (1 year). Divorced. Has 2 children: Nasrul (son, age 14); Nurul Ain (daughter, age 19). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 6 years. Liabilities: mortgage only. Currently holds: Critical Illness (renews November 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers WhatsApp for contact. Has a will in place. Fact-find last completed October 2025. Last direct contact was February 2026, 124 days ago. He is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '3 source interactions', '2026-02-16'),
  ('aag-memory-CL-0020', 'CL-0020', 'profile', 'Consolidated client memory', 'Aisyah binti Rahman is a 60-year-old restaurant owner, a client since April 2022 (4 years). Married to Azman. Came in through a referral from an existing client.', 'Aisyah binti Rahman is a 60-year-old restaurant owner, a client since April 2022 (4 years). Married to Azman. Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 11 years. Liabilities: mortgage only. Currently holds: Medical (renews July 2026); Life (renews November 2026).

Also worth noting (preference): Prefers WhatsApp over email, says she rarely checks email outside work hours.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2025. Last direct contact was April 2026, 52 days ago. She used to play competitive badminton at state level back in school. She spends most weekends hiking nearby trails with a small group of friends.', 'AAG memory synthesis', '3 source interactions', '2026-04-29'),
  ('aag-memory-CL-0021', 'CL-0021', 'profile', 'Consolidated client memory', 'Deepa a/p Rajendran is a 30-year-old software engineer, a client since February 2021 (5 years). Married to Ganesh. Has 2 children: Anitha (daughter, age 8); Kavitha (daughter, age 9). Acquired through a corporate event.', 'Deepa a/p Rajendran is a 30-year-old software engineer, a client since February 2021 (5 years). Married to Ganesh. Has 2 children: Anitha (daughter, age 8); Kavitha (daughter, age 9). Acquired through a corporate event.

Falls in the RM400k+ income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 16 years. Liabilities: car loan only. Currently holds: General Insurance (renews July 2026).

Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed September 2024. Last direct contact was October 2025, 241 days ago. She spends most weekends hiking nearby trails with a small group of friends. She has been learning to play the guitar over the past year, mostly self-taught from online videos.', 'AAG memory synthesis', '2 source interactions', '2025-10-22'),
  ('aag-memory-CL-0022', 'CL-0022', 'profile', 'Consolidated client memory', 'Nasrul bin Mahmud is a 35-year-old bank officer, a client since March 2021 (5 years). Single. Has 1 child: Mohd Syafiq (son, age 11).', 'Nasrul bin Mahmud is a 35-year-old bank officer, a client since March 2021 (5 years). Single. Has 1 child: Mohd Syafiq (son, age 11).

Falls in the RM80k-150k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 22 years. Liabilities: mortgage, education loan. Currently holds: General Insurance (renews May 2027).

Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed October 2024. Last direct contact was November 2025, 225 days ago. He recently picked up baking, has been perfecting a sourdough recipe. He is a keen amateur photographer, mostly street photography around the city on weekends.', 'AAG memory synthesis', '2 source interactions', '2025-11-07'),
  ('aag-memory-CL-0023', 'CL-0023', 'profile', 'Consolidated client memory', 'Nasrul bin Hassan is a 37-year-old university lecturer, a client since October 2022 (3 years). Married to Zalina. Has 1 child: Shahrul Nizam (son, age 16). Originally a cold outreach contact.', 'Nasrul bin Hassan is a 37-year-old university lecturer, a client since October 2022 (3 years). Married to Zalina. Has 1 child: Shahrul Nizam (son, age 16). Originally a cold outreach contact.

Falls in the RM250k-400k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 21 years. Liabilities: business loan. Currently holds: Medical (renews July 2026).

Mentioned in February 2026: Aging parents need medical care support — expected to become relevant again around July 2026. Mentioned in April 2026: Inherited a sum from a late relative.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed May 2025. Last direct contact was April 2026, 78 days ago. He volunteers at a local animal shelter on weekend mornings. He is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '5 source interactions', '2026-04-03'),
  ('aag-memory-CL-0024', 'CL-0024', 'profile', 'Consolidated client memory', 'Suraya binti Hassan is a 42-year-old lawyer, a client since January 2022 (4 years). Divorced. Has 2 children: Nor Azlina (daughter, age 7); Farid (son, age 2). Came in through a referral from an existing client.', 'Suraya binti Hassan is a 42-year-old lawyer, a client since January 2022 (4 years). Divorced. Has 2 children: Nor Azlina (daughter, age 7); Farid (son, age 2). Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 7 years. Liabilities: mortgage only. Currently holds: Medical (renews March 2027).

Mentioned in December 2025: Farid diagnosed with a health condition requiring ongoing care — expected to become relevant again around February 2026.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed October 2024. Last direct contact was December 2025, 176 days ago. She is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '4 source interactions', '2025-12-26'),
  ('aag-memory-CL-0025', 'CL-0025', 'profile', 'Consolidated client memory', 'Hisyam bin Hassan is a 61-year-old dentist, a client since January 2021 (5 years). Divorced. Has 1 child: Ahmad Faiz (son, age 5).', 'Hisyam bin Hassan is a 61-year-old dentist, a client since January 2021 (5 years). Divorced. Has 1 child: Ahmad Faiz (son, age 5).

Falls in the RM400k+ income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 22 years. Liabilities: mortgage only. Currently holds: Critical Illness (renews December 2026); Life (renews November 2026); Investment-linked (renews May 2027).

Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed October 2025. Last direct contact was February 2026, 130 days ago. He is an avid weekend cyclist, recently completed a 100km charity ride. He is a durian enthusiast with strong opinions about which orchard has the best Musang King.', 'AAG memory synthesis', '3 source interactions', '2026-02-10'),
  ('aag-memory-CL-0026', 'CL-0026', 'profile', 'Consolidated client memory', 'Aiman Hakim bin Hassan is a 38-year-old financial analyst, a client since July 2018 (7 years). Single.', 'Aiman Hakim bin Hassan is a 38-year-old financial analyst, a client since July 2018 (7 years). Single.

Falls in the RM250k-400k income bracket with an estimated net worth of RM8M+. Risk tolerance is aggressive, investment horizon roughly 7 years. Liabilities: none outstanding. Currently holds: General Insurance (renews June 2027).

Mentioned in October 2025: Expecting first child — expected to become relevant again around January 2026.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2025. Last direct contact was October 2025, 242 days ago. He enjoys mahjong sessions with extended family during festive seasons.', 'AAG memory synthesis', '3 source interactions', '2025-10-21'),
  ('aag-memory-CL-0027', 'CL-0027', 'profile', 'Consolidated client memory', 'Ng Mei Yee is a 59-year-old architect, a client since April 2021 (5 years). Married to Xin Yi. Has 1 child: Zhi Hao (daughter, age 14). Came in through a referral from an existing client.', 'Ng Mei Yee is a 59-year-old architect, a client since April 2021 (5 years). Married to Xin Yi. Has 1 child: Zhi Hao (daughter, age 14). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 14 years. Liabilities: mortgage only. Currently holds: Medical (renews June 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed September 2025. Last direct contact was March 2025, 454 days ago. He is training for a half-marathon later this year, runs most mornings before work. He recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '2 source interactions', '2025-03-23'),
  ('aag-memory-CL-0028', 'CL-0028', 'profile', 'Consolidated client memory', 'Amirul bin Mahmud is a 51-year-old lawyer, a client since February 2020 (6 years). Married to Siti Khadijah. Has 2 children: Rizal (son, age 27); Siti Aminah (daughter, age 15). Came in through a referral from an existing client.', 'Amirul bin Mahmud is a 51-year-old lawyer, a client since February 2020 (6 years). Married to Siti Khadijah. Has 2 children: Rizal (son, age 27); Siti Aminah (daughter, age 15). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 20 years. Liabilities: none outstanding. Currently holds: Life (renews December 2026); Investment-linked (renews September 2026).

Mentioned in March 2026: Planning to relocate overseas for work — expected to become relevant again around March 2027. Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed April 2026. Last direct contact was March 2026, 83 days ago. He collects vinyl records, mostly 80s Cantopop and jazz.', 'AAG memory synthesis', '5 source interactions', '2026-03-29'),
  ('aag-memory-CL-0029', 'CL-0029', 'profile', 'Consolidated client memory', 'Zalina binti Salleh is a 58-year-old accountant, a client since December 2020 (5 years). Married to Aiman Hakim. Has 4 children: Nor Azlina (daughter, age 23); Iskandar (son, age 27); Nurhaliza (daughter, age 11); Noraini (daughter, age 5).', 'Zalina binti Salleh is a 58-year-old accountant, a client since December 2020 (5 years). Married to Aiman Hakim. Has 4 children: Nor Azlina (daughter, age 23); Iskandar (son, age 27); Nurhaliza (daughter, age 11); Noraini (daughter, age 5).

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 16 years. Liabilities: mortgage only. Currently holds: Life (renews May 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed May 2025. Last direct contact was September 2025, 268 days ago. She is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '2 source interactions', '2025-09-25'),
  ('aag-memory-CL-0030', 'CL-0030', 'profile', 'Consolidated client memory', 'Zalina binti Bakar is a 54-year-old civil engineer, a client since November 2020 (5 years). Has 4 children: Suraya (daughter, age 11); Nor Azlina (daughter, age 7); Rizal (son, age 28); Mohd Hafiz (son, age 31). Came in through a referral from an existing client.', 'Zalina binti Bakar is a 54-year-old civil engineer, a client since November 2020 (5 years). Has 4 children: Suraya (daughter, age 11); Nor Azlina (daughter, age 7); Rizal (son, age 28); Mohd Hafiz (son, age 31). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 24 years. Liabilities: car loan only. Currently holds: Education Savings (renews February 2027); General Insurance (renews May 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2025. Last direct contact was May 2025, 413 days ago. She keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '1 source interactions', '2025-05-03'),
  ('aag-memory-CL-0031', 'CL-0031', 'profile', 'Consolidated client memory', 'Lee Kai Xin is a 53-year-old lawyer, a client since February 2024 (2 years). Married to Jun Wei. Has 2 children: Mei Ling (son, age 11); Su Ann (son, age 3). Came in through a referral from an existing client.', 'Lee Kai Xin is a 53-year-old lawyer, a client since February 2024 (2 years). Married to Jun Wei. Has 2 children: Mei Ling (son, age 11); Su Ann (son, age 3). Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 10 years. Liabilities: car loan only. Currently holds: Investment-linked (renews June 2026); General Insurance (renews October 2026).

Mentioned in December 2025: Considering a career change. Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed September 2024. Last direct contact was December 2025, 187 days ago. He has a rescue dog that often comes up in conversation. He is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '5 source interactions', '2025-12-15'),
  ('aag-memory-CL-0032', 'CL-0032', 'profile', 'Consolidated client memory', 'Zalina binti Rahman is a 59-year-old lawyer, a client since November 2023 (2 years). Married to Hisyam. Has 2 children: Aiman Hakim (son, age 28); Siti Aminah (daughter, age 3). Came in through a referral from an existing client.', 'Zalina binti Rahman is a 59-year-old lawyer, a client since November 2023 (2 years). Married to Hisyam. Has 2 children: Aiman Hakim (son, age 28); Siti Aminah (daughter, age 3). Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 17 years. Liabilities: business loan. Currently holds: Life (renews December 2026); Education Savings (renews November 2026).

Mentioned in March 2026: Inherited a sum from a late relative. Mentioned in June 2026: Newly promoted, income increasing.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed April 2025. Last direct contact was June 2026, 19 days ago. She is a big fan of Korean dramas, usually has one running in the background most evenings.', 'AAG memory synthesis', '4 source interactions', '2026-06-01'),
  ('aag-memory-CL-0033', 'CL-0033', 'profile', 'Consolidated client memory', 'Loh Su Ann is a 33-year-old operations manager, a client since February 2020 (6 years). Has 1 child: Kai Xin (son, age 0). Acquired through a corporate event.', 'Loh Su Ann is a 33-year-old operations manager, a client since February 2020 (6 years). Has 1 child: Kai Xin (son, age 0). Acquired through a corporate event.

Falls in the RM80k-150k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 22 years. Liabilities: none outstanding. Currently holds: Investment-linked (renews August 2026); Investment-linked (renews February 2027); Investment-linked (renews January 2027).

Mentioned in February 2026: Kai Xin diagnosed with a health condition requiring ongoing care — expected to become relevant again around January 2027. Mentioned in May 2026: Inherited a sum from a late relative.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed October 2024. Last direct contact was May 2026, 28 days ago. She has been learning to play the guitar over the past year, mostly self-taught from online videos. She is a big fan of Korean dramas, usually has one running in the background most evenings.', 'AAG memory synthesis', '5 source interactions', '2026-05-23'),
  ('aag-memory-CL-0034', 'CL-0034', 'profile', 'Consolidated client memory', 'Siti Aminah binti Mahmud is a 65-year-old architect, a client since June 2023 (3 years). Married to Amirul. Has 2 children: Wan Aishah (daughter, age 41); Zulkifli (son, age 12). Came in through a referral from an existing client.', 'Siti Aminah binti Mahmud is a 65-year-old architect, a client since June 2023 (3 years). Married to Amirul. Has 2 children: Wan Aishah (daughter, age 41); Zulkifli (son, age 12). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 9 years. Liabilities: mortgage, education loan. Currently holds: Investment-linked (renews March 2027).

Mentioned in January 2026: Aging parents need medical care support — expected to become relevant again around March 2026. Also worth noting (preference): Prefers WhatsApp over email, says she rarely checks email outside work hours.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed September 2025. Last direct contact was January 2026, 163 days ago. She is learning Mandarin in spare time, says it helps with business dealings.', 'AAG memory synthesis', '3 source interactions', '2026-01-08'),
  ('aag-memory-CL-0035', 'CL-0035', 'profile', 'Consolidated client memory', 'Ong Su Ann is a 25-year-old secondary school teacher, a client since October 2022 (3 years). Divorced. Has 2 children: Shu Fen (daughter, age 1); Hui Min (son, age 3). Originally a cold outreach contact.', 'Ong Su Ann is a 25-year-old secondary school teacher, a client since October 2022 (3 years). Divorced. Has 2 children: Shu Fen (daughter, age 1); Hui Min (son, age 3). Originally a cold outreach contact.

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 5 years. Liabilities: mortgage, education loan. Currently holds: General Insurance (renews June 2026); Medical (renews June 2026).

Mentioned in January 2026: Considering a career change. Mentioned in January 2026: Inherited a sum from a late relative.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed July 2025. Last direct contact was January 2026, 160 days ago. He is an avid weekend cyclist, recently completed a 100km charity ride.', 'AAG memory synthesis', '3 source interactions', '2026-01-11'),
  ('aag-memory-CL-0036', 'CL-0036', 'profile', 'Consolidated client memory', 'Sim Xin Yi is a 48-year-old management consultant, a client since December 2020 (5 years). Married to Shu Fen. Has 1 child: Yong Jie (son, age 7). Came in through a referral from an existing client.', 'Sim Xin Yi is a 48-year-old management consultant, a client since December 2020 (5 years). Married to Shu Fen. Has 1 child: Yong Jie (son, age 7). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM250k-1M. Risk tolerance is moderate, investment horizon roughly 21 years. Liabilities: mortgage, education loan. Currently holds: Investment-linked (renews May 2027).

Mentioned in January 2026: Aging parents need medical care support — expected to become relevant again around May 2026.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed October 2024. Last direct contact was January 2026, 166 days ago. She is learning Mandarin in spare time, says it helps with business dealings. She is a durian enthusiast with strong opinions about which orchard has the best Musang King.', 'AAG memory synthesis', '3 source interactions', '2026-01-05'),
  ('aag-memory-CL-0037', 'CL-0037', 'profile', 'Consolidated client memory', 'Pravin a/l Veerasamy is a 31-year-old secondary school teacher, a client since February 2023 (3 years). Married to Lakshmi. Has 3 children: Priya (daughter, age 8); Anitha (daughter, age 2); Meera (daughter, age 8). Came in through a referral from an existing client.', 'Pravin a/l Veerasamy is a 31-year-old secondary school teacher, a client since February 2023 (3 years). Married to Lakshmi. Has 3 children: Priya (daughter, age 8); Anitha (daughter, age 2); Meera (daughter, age 8). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 21 years. Liabilities: mortgage, car loan. Currently holds: Life (renews February 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed July 2025. Last direct contact was February 2026, 118 days ago. He is an avid weekend cyclist, recently completed a 100km charity ride.', 'AAG memory synthesis', '3 source interactions', '2026-02-22'),
  ('aag-memory-CL-0038', 'CL-0038', 'profile', 'Consolidated client memory', 'Aisyah binti Yusof is a 45-year-old operations manager, a client since April 2023 (3 years). Married to Khairul Anwar. Has 1 child: Wan Aishah (daughter, age 1). Came in through a referral from an existing client.', 'Aisyah binti Yusof is a 45-year-old operations manager, a client since April 2023 (3 years). Married to Khairul Anwar. Has 1 child: Wan Aishah (daughter, age 1). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 22 years. Liabilities: mortgage, car loan. Currently holds: Life (renews June 2026); Medical (renews February 2027).

Mentioned in January 2026: Aging parents need medical care support — expected to become relevant again around July 2026. Mentioned in March 2026: Inherited a sum from a late relative.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed December 2025. Last direct contact was March 2026, 88 days ago. She recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '5 source interactions', '2026-03-24'),
  ('aag-memory-CL-0039', 'CL-0039', 'profile', 'Consolidated client memory', 'Teh Mei Ling is a 31-year-old bank officer, a client since March 2019 (7 years). Married to Wen Jun. Has 1 child: Li Wen (son, age 1).', 'Teh Mei Ling is a 31-year-old bank officer, a client since March 2019 (7 years). Married to Wen Jun. Has 1 child: Li Wen (son, age 1).

Falls in the RM250k-400k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 5 years. Liabilities: mortgage only. Currently holds: General Insurance (renews March 2027); Investment-linked (renews May 2026).

Mentioned in February 2026: Inherited a sum from a late relative.

Prefers Phone call for contact. Has a will in place. Fact-find last completed April 2026. Last direct contact was February 2026, 119 days ago. She is a durian enthusiast with strong opinions about which orchard has the best Musang King.', 'AAG memory synthesis', '3 source interactions', '2026-02-21'),
  ('aag-memory-CL-0040', 'CL-0040', 'profile', 'Consolidated client memory', 'Suraya binti Karim is a 50-year-old architect, a client since May 2020 (6 years). Single. Has 1 child: Aisyah (daughter, age 6).', 'Suraya binti Karim is a 50-year-old architect, a client since May 2020 (6 years). Single. Has 1 child: Aisyah (daughter, age 6).

Falls in the RM400k+ income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 24 years. Liabilities: car loan only. Currently holds: General Insurance (renews April 2027); General Insurance (renews November 2026); Education Savings (renews April 2027).

Mentioned in February 2026: Aisyah diagnosed with a health condition requiring ongoing care — expected to become relevant again around March 2026. Also worth noting (preference): Prefers WhatsApp over email, says she rarely checks email outside work hours.

Prefers WhatsApp for contact. Has a will in place. Fact-find last completed September 2025. Last direct contact was May 2026, 50 days ago. She plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '5 source interactions', '2026-05-01'),
  ('aag-memory-CL-0041', 'CL-0041', 'profile', 'Consolidated client memory', 'Nurul Ain binti Bakar is a 43-year-old medical doctor, a client since September 2021 (4 years). Married to Zulkifli. Has 1 child: Mohd Hafiz (son, age 20).', 'Nurul Ain binti Bakar is a 43-year-old medical doctor, a client since September 2021 (4 years). Married to Zulkifli. Has 1 child: Mohd Hafiz (son, age 20).

Falls in the RM48k-80k income bracket with an estimated net worth of RM8M+. Risk tolerance is moderate, investment horizon roughly 4 years. Liabilities: mortgage, education loan. Currently holds: Critical Illness (renews December 2026).

Mentioned in October 2025: Newly promoted, income increasing. Mentioned in April 2026: Considering a career change. Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed March 2026. Last direct contact was April 2026, 53 days ago. She spends most weekends hiking nearby trails with a small group of friends.', 'AAG memory synthesis', '6 source interactions', '2026-04-28'),
  ('aag-memory-CL-0042', 'CL-0042', 'profile', 'Consolidated client memory', 'Shanthi a/p Subramaniam is a 53-year-old business owner, a client since July 2022 (3 years). Married to Ganesh. Has 4 children: Pravin (son, age 27); Lakshmi (daughter, age 5); Deepa (daughter, age 5); Kavitha (daughter, age 9). Acquired through a corporate event.', 'Shanthi a/p Subramaniam is a 53-year-old business owner, a client since July 2022 (3 years). Married to Ganesh. Has 4 children: Pravin (son, age 27); Lakshmi (daughter, age 5); Deepa (daughter, age 5); Kavitha (daughter, age 9). Acquired through a corporate event.

Falls in the RM250k-400k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is moderate, investment horizon roughly 11 years. Liabilities: mortgage, car loan. Currently holds: Critical Illness (renews March 2027).

Mentioned in March 2026: Planning to relocate overseas for work — expected to become relevant again around June 2026.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed December 2024. Last direct contact was March 2026, 100 days ago. She enjoys mahjong sessions with extended family during festive seasons. She is training for a half-marathon later this year, runs most mornings before work.', 'AAG memory synthesis', '4 source interactions', '2026-03-12'),
  ('aag-memory-CL-0043', 'CL-0043', 'profile', 'Consolidated client memory', 'Nur Aina binti Salleh is a 39-year-old logistics manager, a client since August 2022 (3 years). Single. Has 1 child: Nurhaliza (daughter, age 10). Came in through a referral from an existing client.', 'Nur Aina binti Salleh is a 39-year-old logistics manager, a client since August 2022 (3 years). Single. Has 1 child: Nurhaliza (daughter, age 10). Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 9 years. Liabilities: business loan. Currently holds: Investment-linked (renews October 2026); Medical (renews November 2026); Life (renews March 2027).

Mentioned in January 2026: Newly promoted, income increasing.

Prefers Email for contact. Has a will in place. Fact-find last completed March 2025. Last direct contact was January 2026, 164 days ago. She is into specialty coffee, has strong opinions about pour-over versus espresso. She is learning Mandarin in spare time, says it helps with business dealings.', 'AAG memory synthesis', '3 source interactions', '2026-01-07'),
  ('aag-memory-CL-0044', 'CL-0044', 'profile', 'Consolidated client memory', 'Lim Boon Keat is a 54-year-old staff nurse, a client since August 2019 (6 years). Single. Originally a cold outreach contact.', 'Lim Boon Keat is a 54-year-old staff nurse, a client since August 2019 (6 years). Single. Originally a cold outreach contact.

Falls in the RM250k-400k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 23 years. Liabilities: business loan. Currently holds: Critical Illness (renews July 2026).

Mentioned in February 2026: Newly promoted, income increasing. Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed February 2025. Last direct contact was May 2026, 32 days ago. He is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '4 source interactions', '2026-05-19'),
  ('aag-memory-CL-0045', 'CL-0045', 'profile', 'Consolidated client memory', 'Noraini binti Hassan is a 55-year-old business owner, a client since July 2021 (4 years). Single. Has 3 children: Farid (son, age 15); Hidayah (daughter, age 21); Aiman Hakim (son, age 25). Came in through a referral from an existing client.', 'Noraini binti Hassan is a 55-year-old business owner, a client since July 2021 (4 years). Single. Has 3 children: Farid (son, age 15); Hidayah (daughter, age 21); Aiman Hakim (son, age 25). Came in through a referral from an existing client.

Falls in the RM150k-250k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 17 years. Liabilities: none outstanding. Currently holds: Medical (renews September 2026).

Mentioned in December 2025: Planning to relocate overseas for work — expected to become relevant again around February 2027.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed November 2025. Last direct contact was December 2025, 171 days ago. She is training for a half-marathon later this year, runs most mornings before work.', 'AAG memory synthesis', '4 source interactions', '2025-12-31'),
  ('aag-memory-CL-0046', 'CL-0046', 'profile', 'Consolidated client memory', 'Rizal bin Salleh is a 43-year-old pharmacist, a client since December 2021 (4 years). Married to Noraini. Has 2 children: Farah Diana (daughter, age 5); Hidayah (daughter, age 5). Came in through a referral from an existing client.', 'Rizal bin Salleh is a 43-year-old pharmacist, a client since December 2021 (4 years). Married to Noraini. Has 2 children: Farah Diana (daughter, age 5); Hidayah (daughter, age 5). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of Below RM250k. Risk tolerance is conservative, investment horizon roughly 9 years. Liabilities: business loan. Currently holds: Critical Illness (renews December 2026); Critical Illness (renews August 2026).

Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed July 2024. Last direct contact was September 2025, 281 days ago. He spends most weekends hiking nearby trails with a small group of friends.', 'AAG memory synthesis', '2 source interactions', '2025-09-12'),
  ('aag-memory-CL-0047', 'CL-0047', 'profile', 'Consolidated client memory', 'Meera a/p Nair is a 63-year-old logistics manager, a client since February 2024 (2 years). Single. Has 1 child: Mahesh (son, age 7).', 'Meera a/p Nair is a 63-year-old logistics manager, a client since February 2024 (2 years). Single. Has 1 child: Mahesh (son, age 7).

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 9 years. Liabilities: mortgage only. Currently holds: Education Savings (renews October 2026); General Insurance (renews October 2026).

Mentioned in November 2025: Considering a career change.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed August 2024. Last direct contact was January 2026, 141 days ago. She keeps tropical fish as a hobby, with a fairly elaborate home aquarium setup.', 'AAG memory synthesis', '2 source interactions', '2026-01-30'),
  ('aag-memory-CL-0048', 'CL-0048', 'profile', 'Consolidated client memory', 'Goh Mei Ling is a 58-year-old accountant, a client since November 2019 (6 years). Married to Kai Xin. Has 4 children: Wen Jun (son, age 0); Jun Wei (son, age 22); Cheng Hoe (son, age 25); Hui Min (daughter, age 31).', 'Goh Mei Ling is a 58-year-old accountant, a client since November 2019 (6 years). Married to Kai Xin. Has 4 children: Wen Jun (son, age 0); Jun Wei (son, age 22); Cheng Hoe (son, age 25); Hui Min (daughter, age 31).

Falls in the RM80k-150k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 21 years. Liabilities: business loan. Currently holds: Life (renews June 2026); Life (renews August 2026); Medical (renews May 2027).

Mentioned in November 2025: Recently purchased a new home. Mentioned in May 2026: Planning early retirement — expected to become relevant again around April 2027.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed March 2025. Last direct contact was May 2026, 41 days ago. He is a keen amateur photographer, mostly street photography around the city on weekends.', 'AAG memory synthesis', '3 source interactions', '2026-05-10'),
  ('aag-memory-CL-0049', 'CL-0049', 'profile', 'Consolidated client memory', 'Khairul Anwar bin Rashid is a 29-year-old it project manager, a client since February 2019 (7 years). Married to Zalina. Has 1 child: Farid (son, age 2). Originally a cold outreach contact.', 'Khairul Anwar bin Rashid is a 29-year-old it project manager, a client since February 2019 (7 years). Married to Zalina. Has 1 child: Farid (son, age 2). Originally a cold outreach contact.

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 17 years. Liabilities: car loan only. Currently holds: Medical (renews December 2026); Life (renews July 2026).

Mentioned in March 2026: Newly promoted, income increasing.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed September 2025. Last direct contact was March 2026, 86 days ago. He recently picked up baking, has been perfecting a sourdough recipe. He has been learning to play the guitar over the past year, mostly self-taught from online videos.', 'AAG memory synthesis', '2 source interactions', '2026-03-26'),
  ('aag-memory-CL-0050', 'CL-0050', 'profile', 'Consolidated client memory', 'Farid bin Ismail is a 41-year-old financial analyst, a client since November 2021 (4 years). Divorced.', 'Farid bin Ismail is a 41-year-old financial analyst, a client since November 2021 (4 years). Divorced.

Falls in the RM48k-80k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 8 years. Liabilities: business loan. Currently holds: Life (renews March 2027); Life (renews June 2026).

Mentioned in November 2025: Planning to relocate overseas for work — expected to become relevant again around November 2026.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2026. Last direct contact was November 2025, 231 days ago. He keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '4 source interactions', '2025-11-01'),
  ('aag-memory-CL-0051', 'CL-0051', 'profile', 'Consolidated client memory', 'Lim Wei Ling is a 56-year-old civil engineer, a client since February 2024 (2 years). Married to Mei Ling. Came in through a referral from an existing client.', 'Lim Wei Ling is a 56-year-old civil engineer, a client since February 2024 (2 years). Married to Mei Ling. Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 11 years. Liabilities: mortgage, education loan. Currently holds: Life (renews November 2026); Life (renews October 2026).

Mentioned in March 2026: Recently purchased a new home. Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed January 2026. Last direct contact was March 2026, 100 days ago. He enjoys mahjong sessions with extended family during festive seasons. He keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '5 source interactions', '2026-03-12'),
  ('aag-memory-CL-0052', 'CL-0052', 'profile', 'Consolidated client memory', 'Iskandar bin Hassan is a 64-year-old hr manager, a client since August 2019 (6 years). Married to Nurhaliza. Has 1 child: Shahrul Nizam (son, age 29). Came in through a referral from an existing client.', 'Iskandar bin Hassan is a 64-year-old hr manager, a client since August 2019 (6 years). Married to Nurhaliza. Has 1 child: Shahrul Nizam (son, age 29). Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM8M+. Risk tolerance is aggressive, investment horizon roughly 10 years. Liabilities: business loan. Currently holds: Medical (renews May 2027); Life (renews December 2026); Investment-linked (renews May 2026).

Mentioned in October 2025: Aging parents need medical care support — expected to become relevant again around July 2026. Mentioned in April 2026: Newly promoted, income increasing.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed July 2025. Last direct contact was April 2026, 62 days ago. He is training for a half-marathon later this year, runs most mornings before work.', 'AAG memory synthesis', '4 source interactions', '2026-04-19'),
  ('aag-memory-CL-0053', 'CL-0053', 'profile', 'Consolidated client memory', 'Chong Wen Jun is a 37-year-old software engineer, a client since July 2023 (2 years). Married to Choon Hong. Has 4 children: Xin Yi (son, age 3); Cheng Hoe (daughter, age 3); Li Wen (daughter, age 14); Hui Min (son, age 3). Came in through a referral from an existing client.', 'Chong Wen Jun is a 37-year-old software engineer, a client since July 2023 (2 years). Married to Choon Hong. Has 4 children: Xin Yi (son, age 3); Cheng Hoe (daughter, age 3); Li Wen (daughter, age 14); Hui Min (son, age 3). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 25 years. Liabilities: mortgage only. Currently holds: Life (renews May 2027).

Mentioned in April 2026: Aging parents need medical care support — expected to become relevant again around May 2026. Mentioned in May 2026: Newly promoted, income increasing. Also worth noting (preference): Prefers WhatsApp over email, says she rarely checks email outside work hours.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed November 2025. Last direct contact was May 2026, 46 days ago. She used to play competitive badminton at state level back in school.', 'AAG memory synthesis', '6 source interactions', '2026-05-05'),
  ('aag-memory-CL-0054', 'CL-0054', 'profile', 'Consolidated client memory', 'Siti Aminah binti Ismail is a 52-year-old hr manager, a client since April 2021 (5 years). Married to Iskandar. Has 1 child: Zulkifli (son, age 3). Came in through a referral from an existing client.', 'Siti Aminah binti Ismail is a 52-year-old hr manager, a client since April 2021 (5 years). Married to Iskandar. Has 1 child: Zulkifli (son, age 3). Came in through a referral from an existing client.

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 10 years. Liabilities: mortgage, education loan. Currently holds: Life (renews December 2026); Education Savings (renews January 2027).

Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers Email for contact. Has a will in place. Fact-find last completed May 2025. Last direct contact was November 2025, 226 days ago. She keeps tropical fish as a hobby, with a fairly elaborate home aquarium setup. She is an avid weekend cyclist, recently completed a 100km charity ride.', 'AAG memory synthesis', '4 source interactions', '2025-11-06'),
  ('aag-memory-CL-0055', 'CL-0055', 'profile', 'Consolidated client memory', 'Sim Shu Fen is a 49-year-old university lecturer, a client since December 2023 (2 years). Married to Boon Keat. Has 2 children: Kai Xin (daughter, age 16); Su Ann (son, age 29). Came in through a referral from an existing client.', 'Sim Shu Fen is a 49-year-old university lecturer, a client since December 2023 (2 years). Married to Boon Keat. Has 2 children: Kai Xin (daughter, age 16); Su Ann (son, age 29). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 7 years. Liabilities: none outstanding. Currently holds: Life (renews February 2027).

Mentioned in December 2025: Recently purchased a new home.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed October 2024. Last direct contact was March 2026, 96 days ago. He is an avid weekend cyclist, recently completed a 100km charity ride.', 'AAG memory synthesis', '3 source interactions', '2026-03-16'),
  ('aag-memory-CL-0056', 'CL-0056', 'profile', 'Consolidated client memory', 'Anand a/l Nair is a 66-year-old secondary school teacher, a client since February 2024 (2 years). Single. Has 2 children: Vimal (son, age 40); Mahesh (son, age 21). Originally a cold outreach contact.', 'Anand a/l Nair is a 66-year-old secondary school teacher, a client since February 2024 (2 years). Single. Has 2 children: Vimal (son, age 40); Mahesh (son, age 21). Originally a cold outreach contact.

Falls in the RM48k-80k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 25 years. Liabilities: mortgage, education loan. Currently holds: Critical Illness (renews May 2026); Investment-linked (renews September 2026); Critical Illness (renews December 2026).

Mentioned in October 2025: Aging parents need medical care support — expected to become relevant again around January 2026.

Prefers WhatsApp for contact. Has a will in place. Fact-find last completed February 2026. Last direct contact was October 2025, 260 days ago. He is into specialty coffee, has strong opinions about pour-over versus espresso.', 'AAG memory synthesis', '2 source interactions', '2025-10-03'),
  ('aag-memory-CL-0057', 'CL-0057', 'profile', 'Consolidated client memory', 'Ong Pei Shan is a 52-year-old civil engineer, a client since April 2022 (4 years). Divorced. Came in through a referral from an existing client.', 'Ong Pei Shan is a 52-year-old civil engineer, a client since April 2022 (4 years). Divorced. Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is moderate, investment horizon roughly 25 years. Liabilities: none outstanding. Currently holds: Investment-linked (renews April 2027); Life (renews December 2026).

Mentioned in October 2025: Recently divorced, reviewing beneficiaries. Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed February 2025. Last direct contact was April 2026, 61 days ago. She is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '4 source interactions', '2026-04-20'),
  ('aag-memory-CL-0058', 'CL-0058', 'profile', 'Consolidated client memory', 'Loh Choon Hong is a 28-year-old university lecturer, a client since August 2025 (1 year). Single. Has 3 children: Jia Hao (son, age 6); Shu Fen (daughter, age 6); Mei Yee (daughter, age 3).', 'Loh Choon Hong is a 28-year-old university lecturer, a client since August 2025 (1 year). Single. Has 3 children: Jia Hao (son, age 6); Shu Fen (daughter, age 6); Mei Yee (daughter, age 3).

Falls in the RM48k-80k income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 19 years. Liabilities: none outstanding. Currently holds: Life (renews June 2027); Medical (renews July 2026).

Mentioned in December 2025: Newly promoted, income increasing. Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2025. Last direct contact was January 2026, 161 days ago. He spends most weekends hiking nearby trails with a small group of friends. He enjoys mahjong sessions with extended family during festive seasons.', 'AAG memory synthesis', '5 source interactions', '2026-01-10'),
  ('aag-memory-CL-0059', 'CL-0059', 'profile', 'Consolidated client memory', 'Rizal bin Karim is a 55-year-old sales manager, a client since April 2023 (3 years). Single. Came in through a referral from an existing client.', 'Rizal bin Karim is a 55-year-old sales manager, a client since April 2023 (3 years). Single. Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is moderate, investment horizon roughly 11 years. Liabilities: car loan only. Currently holds: Investment-linked (renews October 2026); Medical (renews July 2026); Investment-linked (renews May 2027).

Mentioned in September 2025: Exploring business expansion — expected to become relevant again around April 2026. Mentioned in September 2025: Planning to relocate overseas for work — expected to become relevant again around December 2025.

Prefers Email for contact. Has a will in place. Fact-find last completed January 2025. Last direct contact was September 2025, 263 days ago. He enjoys mahjong sessions with extended family during festive seasons.', 'AAG memory synthesis', '4 source interactions', '2025-09-30'),
  ('aag-memory-CL-0060', 'CL-0060', 'profile', 'Consolidated client memory', 'Chong Shu Fen is a 51-year-old secondary school teacher, a client since November 2025 (1 year). Married to Zhi Hao. Has 4 children: Mei Yee (daughter, age 10); Jia Hao (son, age 18); Boon Keat (son, age 10); Xin Yi (son, age 14). Acquired through a corporate event.', 'Chong Shu Fen is a 51-year-old secondary school teacher, a client since November 2025 (1 year). Married to Zhi Hao. Has 4 children: Mei Yee (daughter, age 10); Jia Hao (son, age 18); Boon Keat (son, age 10); Xin Yi (son, age 14). Acquired through a corporate event.

Falls in the RM250k-400k income bracket with an estimated net worth of Below RM250k. Risk tolerance is conservative, investment horizon roughly 23 years. Liabilities: mortgage only. Currently holds: Investment-linked (renews March 2027).

Mentioned in February 2026: Recently purchased a new home.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed July 2024. Last direct contact was May 2026, 47 days ago. He enjoys mahjong sessions with extended family during festive seasons. He is a karaoke regular, says it''s the best way to unwind after a long week.', 'AAG memory synthesis', '4 source interactions', '2026-05-04'),
  ('aag-memory-CL-0061', 'CL-0061', 'profile', 'Consolidated client memory', 'Loh Yong Jie is a 54-year-old sales manager, a client since August 2022 (3 years). Came in through a referral from an existing client.', 'Loh Yong Jie is a 54-year-old sales manager, a client since August 2022 (3 years). Came in through a referral from an existing client.

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is moderate, investment horizon roughly 15 years. Liabilities: business loan. Currently holds: Education Savings (renews August 2026); General Insurance (renews January 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed February 2025. Last direct contact was September 2023, 1016 days ago. He is a durian enthusiast with strong opinions about which orchard has the best Musang King. He enjoys mahjong sessions with extended family during festive seasons.', 'AAG memory synthesis', '3 source interactions', '2023-09-08'),
  ('aag-memory-CL-0062', 'CL-0062', 'profile', 'Consolidated client memory', 'Yap Cheng Hoe is a 47-year-old marketing director, a client since January 2025 (1 year). Married to Jia Hao. Has 2 children: Xin Yi (son, age 4); Kai Xin (daughter, age 18). Acquired through a corporate event.', 'Yap Cheng Hoe is a 47-year-old marketing director, a client since January 2025 (1 year). Married to Jia Hao. Has 2 children: Xin Yi (son, age 4); Kai Xin (daughter, age 18). Acquired through a corporate event.

Falls in the RM80k-150k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is moderate, investment horizon roughly 23 years. Liabilities: mortgage only. Currently holds: Critical Illness (renews October 2026).

Mentioned in October 2025: Planning to relocate overseas for work — expected to become relevant again around August 2026. Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed September 2024. Last direct contact was December 2025, 182 days ago. He plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '3 source interactions', '2025-12-20'),
  ('aag-memory-CL-0063', 'CL-0063', 'profile', 'Consolidated client memory', 'Hidayah binti Zainal is a 48-year-old secondary school teacher, a client since June 2023 (3 years). Married to Aiman Hakim. Has 1 child: Iskandar (son, age 11). Originally a cold outreach contact.', 'Hidayah binti Zainal is a 48-year-old secondary school teacher, a client since June 2023 (3 years). Married to Aiman Hakim. Has 1 child: Iskandar (son, age 11). Originally a cold outreach contact.

Falls in the RM400k+ income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 9 years. Liabilities: mortgage, education loan. Currently holds: Life (renews November 2026); General Insurance (renews September 2026).

Mentioned in April 2026: Planning early retirement — expected to become relevant again around July 2027. Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2026. Last direct contact was April 2026, 74 days ago. She is learning Mandarin in spare time, says it helps with business dealings.', 'AAG memory synthesis', '3 source interactions', '2026-04-07'),
  ('aag-memory-CL-0064', 'CL-0064', 'profile', 'Consolidated client memory', 'Mohd Syafiq bin Othman is a 62-year-old operations manager, a client since April 2022 (4 years). Married to Farah Diana. Has 1 child: Aisyah (daughter, age 35). Came in through a referral from an existing client.', 'Mohd Syafiq bin Othman is a 62-year-old operations manager, a client since April 2022 (4 years). Married to Farah Diana. Has 1 child: Aisyah (daughter, age 35). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of Below RM250k. Risk tolerance is conservative, investment horizon roughly 24 years. Liabilities: mortgage, car loan. Currently holds: General Insurance (renews January 2027); Life (renews May 2027); Critical Illness (renews October 2026).

Mentioned in April 2026: Newly promoted, income increasing. Mentioned in June 2026: Planning to relocate overseas for work — expected to become relevant again around January 2027. Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers WhatsApp for contact. Has a will in place. Fact-find last completed January 2025. Last direct contact was June 2026, 19 days ago. He spends most weekends hiking nearby trails with a small group of friends.', 'AAG memory synthesis', '6 source interactions', '2026-06-01'),
  ('aag-memory-CL-0065', 'CL-0065', 'profile', 'Consolidated client memory', 'Nor Azlina binti Bakar is a 52-year-old hr manager, a client since February 2020 (6 years). Married to Aiman Hakim. Has 2 children: Hidayah (daughter, age 7); Noraini (daughter, age 4). Originally a cold outreach contact.', 'Nor Azlina binti Bakar is a 52-year-old hr manager, a client since February 2020 (6 years). Married to Aiman Hakim. Has 2 children: Hidayah (daughter, age 7); Noraini (daughter, age 4). Originally a cold outreach contact.

Falls in the RM250k-400k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 21 years. Liabilities: mortgage only. Currently holds: Investment-linked (renews February 2027); General Insurance (renews May 2027).

Mentioned in January 2026: Planning early retirement — expected to become relevant again around June 2026.

Prefers Email for contact. Has a will in place. Fact-find last completed January 2026. Last direct contact was January 2026, 166 days ago. She keeps a small herb garden on the balcony and swaps cuttings with neighbours. She has a rescue dog that often comes up in conversation.', 'AAG memory synthesis', '3 source interactions', '2026-01-05'),
  ('aag-memory-CL-0066', 'CL-0066', 'profile', 'Consolidated client memory', 'Zalina binti Ismail is a 50-year-old real estate agent, a client since September 2019 (6 years). Married to Rizal. Has 3 children: Nasrul (son, age 28); Nurhaliza (daughter, age 14); Amirul (son, age 26).', 'Zalina binti Ismail is a 50-year-old real estate agent, a client since September 2019 (6 years). Married to Rizal. Has 3 children: Nasrul (son, age 28); Nurhaliza (daughter, age 14); Amirul (son, age 26).

Falls in the RM400k+ income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 18 years. Liabilities: mortgage, education loan. Currently holds: Life (renews July 2026); Investment-linked (renews November 2026).

Mentioned in September 2025: Considering a career change. Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed April 2026. Last direct contact was March 2026, 81 days ago. She has a rescue dog that often comes up in conversation.', 'AAG memory synthesis', '4 source interactions', '2026-03-31'),
  ('aag-memory-CL-0067', 'CL-0067', 'profile', 'Consolidated client memory', 'Koh Pei Shan is a 57-year-old secondary school teacher, a client since April 2020 (6 years). Single. Acquired through a corporate event.', 'Koh Pei Shan is a 57-year-old secondary school teacher, a client since April 2020 (6 years). Single. Acquired through a corporate event.

Falls in the RM48k-80k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is moderate, investment horizon roughly 22 years. Liabilities: mortgage, education loan. Currently holds: Investment-linked (renews October 2026).

Mentioned in December 2025: Planning to relocate overseas for work — expected to become relevant again around August 2026. Mentioned in February 2026: Inherited a sum from a late relative. Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers WhatsApp for contact. Has a will in place. Fact-find last completed December 2025. Last direct contact was March 2026, 111 days ago. He volunteers at a local animal shelter on weekend mornings. He recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '6 source interactions', '2026-03-01'),
  ('aag-memory-CL-0068', 'CL-0068', 'profile', 'Consolidated client memory', 'Shahrul Nizam bin Mahmud is a 29-year-old entrepreneur, a client since June 2022 (4 years). Married to Aisyah. Has 2 children: Nor Azlina (daughter, age 8); Iskandar (son, age 4).', 'Shahrul Nizam bin Mahmud is a 29-year-old entrepreneur, a client since June 2022 (4 years). Married to Aisyah. Has 2 children: Nor Azlina (daughter, age 8); Iskandar (son, age 4).

Falls in the RM80k-150k income bracket with an estimated net worth of Below RM250k. Risk tolerance is conservative, investment horizon roughly 3 years. Liabilities: mortgage, education loan. Currently holds: Critical Illness (renews September 2026); Education Savings (renews June 2027).

Mentioned in September 2025: Recently purchased a new home. Mentioned in May 2026: Inherited a sum from a late relative.

Prefers Email for contact. Has a will in place. Fact-find last completed July 2025. Last direct contact was May 2026, 35 days ago. He is a karaoke regular, says it''s the best way to unwind after a long week.', 'AAG memory synthesis', '3 source interactions', '2026-05-16'),
  ('aag-memory-CL-0069', 'CL-0069', 'profile', 'Consolidated client memory', 'Suraya binti Yusof is a 67-year-old lawyer, a client since December 2024 (1 year). Married to Iskandar. Came in through a referral from an existing client.', 'Suraya binti Yusof is a 67-year-old lawyer, a client since December 2024 (1 year). Married to Iskandar. Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 24 years. Liabilities: car loan only. Currently holds: Education Savings (renews February 2027).

Mentioned in February 2026: Planning to relocate overseas for work — expected to become relevant again around October 2026.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed July 2024. Last direct contact was February 2026, 139 days ago. She has a rescue dog that often comes up in conversation. She has been learning to play the guitar over the past year, mostly self-taught from online videos.', 'AAG memory synthesis', '2 source interactions', '2026-02-01'),
  ('aag-memory-CL-0070', 'CL-0070', 'profile', 'Consolidated client memory', 'Senthil a/l Veerasamy is a 25-year-old civil engineer, a client since December 2019 (6 years). Single. Has 1 child: Arun (son, age 5). Originally a cold outreach contact.', 'Senthil a/l Veerasamy is a 25-year-old civil engineer, a client since December 2019 (6 years). Single. Has 1 child: Arun (son, age 5). Originally a cold outreach contact.

Falls in the RM48k-80k income bracket with an estimated net worth of RM8M+. Risk tolerance is aggressive, investment horizon roughly 16 years. Liabilities: mortgage, education loan. Currently holds: General Insurance (renews August 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Has a will in place. Fact-find last completed February 2026. Last direct contact was January 2025, 535 days ago. He is a durian enthusiast with strong opinions about which orchard has the best Musang King.', 'AAG memory synthesis', '3 source interactions', '2025-01-01'),
  ('aag-memory-CL-0071', 'CL-0071', 'profile', 'Consolidated client memory', 'Zalina binti Salleh is a 61-year-old medical doctor, a client since September 2018 (7 years). Single. Has 2 children: Aiman Hakim (son, age 34); Noraini (daughter, age 25). Came in through a referral from an existing client.', 'Zalina binti Salleh is a 61-year-old medical doctor, a client since September 2018 (7 years). Single. Has 2 children: Aiman Hakim (son, age 34); Noraini (daughter, age 25). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of Below RM250k. Risk tolerance is aggressive, investment horizon roughly 20 years. Liabilities: mortgage only. Currently holds: Education Savings (renews December 2026).

Mentioned in January 2026: Exploring business expansion — expected to become relevant again around February 2027. Mentioned in January 2026: Noraini diagnosed with a health condition requiring ongoing care — expected to become relevant again around December 2026.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed July 2025. Last direct contact was January 2026, 143 days ago. She has a rescue dog that often comes up in conversation. She is a board game enthusiast, hosts a regular games night at home.', 'AAG memory synthesis', '5 source interactions', '2026-01-28'),
  ('aag-memory-CL-0072', 'CL-0072', 'profile', 'Consolidated client memory', 'Zalina binti Rahman is a 25-year-old it project manager, a client since July 2020 (5 years). Married to Nasrul. Has 2 children: Shahrul Nizam (son, age 2); Nurhaliza (daughter, age 3).', 'Zalina binti Rahman is a 25-year-old it project manager, a client since July 2020 (5 years). Married to Nasrul. Has 2 children: Shahrul Nizam (son, age 2); Nurhaliza (daughter, age 3).

Falls in the RM80k-150k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 8 years. Liabilities: mortgage, education loan. Currently holds: Medical (renews February 2027); Life (renews February 2027); Medical (renews June 2026).

Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed September 2025. Last direct contact was November 2025, 206 days ago. She is training for a half-marathon later this year, runs most mornings before work. She keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '4 source interactions', '2025-11-26'),
  ('aag-memory-CL-0073', 'CL-0073', 'profile', 'Consolidated client memory', 'Revathi a/p Ramasamy is a 66-year-old business owner, a client since January 2023 (3 years). Married to Ganesh.', 'Revathi a/p Ramasamy is a 66-year-old business owner, a client since January 2023 (3 years). Married to Ganesh.

Falls in the RM80k-150k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 21 years. Liabilities: mortgage only. Currently holds: Education Savings (renews April 2027).

Mentioned in October 2025: Newly promoted, income increasing. Mentioned in November 2025: Aging parents need medical care support — expected to become relevant again around August 2026.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2026. Last direct contact was November 2025, 222 days ago. She spends most weekends hiking nearby trails with a small group of friends.', 'AAG memory synthesis', '3 source interactions', '2025-11-10'),
  ('aag-memory-CL-0074', 'CL-0074', 'profile', 'Consolidated client memory', 'Nasrul bin Salleh is a 26-year-old secondary school teacher, a client since July 2019 (6 years). Married to Siti Aminah. Came in through a referral from an existing client.', 'Nasrul bin Salleh is a 26-year-old secondary school teacher, a client since July 2019 (6 years). Married to Siti Aminah. Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 11 years. Liabilities: mortgage only. Currently holds: Education Savings (renews April 2027); Medical (renews January 2027).

Mentioned in January 2026: Considering a career change.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed January 2026. Last direct contact was January 2026, 160 days ago. He keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '4 source interactions', '2026-01-11'),
  ('aag-memory-CL-0075', 'CL-0075', 'profile', 'Consolidated client memory', 'Suraya binti Salleh is a 41-year-old dentist, a client since March 2021 (5 years). Divorced. Has 2 children: Mohd Syafiq (son, age 13); Wan Aishah (daughter, age 12). Came in through a referral from an existing client.', 'Suraya binti Salleh is a 41-year-old dentist, a client since March 2021 (5 years). Divorced. Has 2 children: Mohd Syafiq (son, age 13); Wan Aishah (daughter, age 12). Came in through a referral from an existing client.

Falls in the RM80k-150k income bracket with an estimated net worth of Below RM250k. Risk tolerance is moderate, investment horizon roughly 10 years. Liabilities: mortgage, car loan. Currently holds: Critical Illness (renews September 2026); Education Savings (renews July 2026); General Insurance (renews October 2026).

Mentioned in January 2026: Wan Aishah diagnosed with a health condition requiring ongoing care — expected to become relevant again around May 2026.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed April 2025. Last direct contact was January 2026, 156 days ago. She plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '4 source interactions', '2026-01-15'),
  ('aag-memory-CL-0076', 'CL-0076', 'profile', 'Consolidated client memory', 'Lee Yong Jie is a 53-year-old it project manager, a client since January 2023 (3 years). Married to Xin Yi. Came in through a referral from an existing client.', 'Lee Yong Jie is a 53-year-old it project manager, a client since January 2023 (3 years). Married to Xin Yi. Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 22 years. Liabilities: mortgage, car loan. Currently holds: Critical Illness (renews March 2027); Life (renews August 2026); Medical (renews April 2027).

Mentioned in February 2026: Planning to relocate overseas for work — expected to become relevant again around March 2027. Also worth noting (sentiment): Seemed hesitant about the recent premium increase, didn''t object outright but wasn''t enthusiastic.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed October 2024. Last direct contact was February 2026, 122 days ago. He keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '3 source interactions', '2026-02-18'),
  ('aag-memory-CL-0077', 'CL-0077', 'profile', 'Consolidated client memory', 'Lakshmi a/p Muthu is a 45-year-old hr manager, a client since August 2024 (1 year). Divorced. Has 2 children: Arun (son, age 8); Senthil (son, age 3).', 'Lakshmi a/p Muthu is a 45-year-old hr manager, a client since August 2024 (1 year). Divorced. Has 2 children: Arun (son, age 8); Senthil (son, age 3).

Falls in the RM150k-250k income bracket with an estimated net worth of Below RM250k. Risk tolerance is moderate, investment horizon roughly 20 years. Liabilities: none outstanding. Currently holds: Critical Illness (renews March 2027); Critical Illness (renews May 2027).

Mentioned in December 2025: Recently purchased a new home.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed August 2025. Last direct contact was December 2025, 176 days ago. She is a durian enthusiast with strong opinions about which orchard has the best Musang King. She collects vinyl records, mostly 80s Cantopop and jazz.', 'AAG memory synthesis', '2 source interactions', '2025-12-26'),
  ('aag-memory-CL-0078', 'CL-0078', 'profile', 'Consolidated client memory', 'Azman bin Zainal is a 35-year-old logistics manager, a client since March 2024 (2 years). Divorced. Has 1 child: Amirul (son, age 6). Came in through a referral from an existing client.', 'Azman bin Zainal is a 35-year-old logistics manager, a client since March 2024 (2 years). Divorced. Has 1 child: Amirul (son, age 6). Came in through a referral from an existing client.

Falls in the RM400k+ income bracket with an estimated net worth of RM3M-8M. Risk tolerance is conservative, investment horizon roughly 24 years. Liabilities: mortgage, education loan. Currently holds: Education Savings (renews June 2026).

Mentioned in September 2025: Inherited a sum from a late relative. Mentioned in February 2026: Considering a career change.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed June 2025. Last direct contact was February 2026, 128 days ago. He used to play competitive badminton at state level back in school.', 'AAG memory synthesis', '4 source interactions', '2026-02-12'),
  ('aag-memory-CL-0079', 'CL-0079', 'profile', 'Consolidated client memory', 'Zulkifli bin Mahmud is a 52-year-old architect, a client since June 2021 (4 years). Married to Zalina. Came in through a referral from an existing client.', 'Zulkifli bin Mahmud is a 52-year-old architect, a client since June 2021 (4 years). Married to Zalina. Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of Below RM250k. Risk tolerance is conservative, investment horizon roughly 21 years. Liabilities: mortgage only. Currently holds: Life (renews May 2027); Critical Illness (renews December 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed August 2025. Last direct contact was May 2025, 406 days ago. He is a durian enthusiast with strong opinions about which orchard has the best Musang King. He is into specialty coffee, has strong opinions about pour-over versus espresso.', 'AAG memory synthesis', '3 source interactions', '2025-05-10'),
  ('aag-memory-CL-0080', 'CL-0080', 'profile', 'Consolidated client memory', 'Rizal bin Karim is a 54-year-old business owner, a client since December 2021 (4 years). Single. Came in through a referral from an existing client.', 'Rizal bin Karim is a 54-year-old business owner, a client since December 2021 (4 years). Single. Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 18 years. Liabilities: mortgage, education loan. Currently holds: Education Savings (renews October 2026).

Mentioned in November 2025: Recently purchased a new home. Mentioned in March 2026: Planning to relocate overseas for work — expected to become relevant again around October 2026. Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed February 2026. Last direct contact was March 2026, 97 days ago. He collects vinyl records, mostly 80s Cantopop and jazz.', 'AAG memory synthesis', '5 source interactions', '2026-03-15'),
  ('aag-memory-CL-0081', 'CL-0081', 'profile', 'Consolidated client memory', 'Mohd Syafiq bin Salleh is a 48-year-old operations manager, a client since January 2019 (7 years). Single. Came in through a referral from an existing client.', 'Mohd Syafiq bin Salleh is a 48-year-old operations manager, a client since January 2019 (7 years). Single. Came in through a referral from an existing client.

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is aggressive, investment horizon roughly 15 years. Liabilities: car loan only. Currently holds: Critical Illness (renews April 2027); Life (renews April 2027).

Mentioned in October 2025: Considering a career change. Mentioned in October 2025: Planning to relocate overseas for work — expected to become relevant again around July 2026.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed November 2024. Last direct contact was October 2025, 236 days ago. He is a durian enthusiast with strong opinions about which orchard has the best Musang King.', 'AAG memory synthesis', '3 source interactions', '2025-10-27'),
  ('aag-memory-CL-0082', 'CL-0082', 'profile', 'Consolidated client memory', 'Nor Azlina binti Othman is a 51-year-old business owner, a client since March 2023 (3 years). Married to Iskandar. Came in through a referral from an existing client.', 'Nor Azlina binti Othman is a 51-year-old business owner, a client since March 2023 (3 years). Married to Iskandar. Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 23 years. Liabilities: business loan. Currently holds: Life (renews December 2026).

Mentioned in November 2025: Considering a career change. Also worth noting (financial detail): Mentioned a side rental income stream not previously captured in the fact-find.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed May 2026. Last direct contact was December 2025, 196 days ago. She is training for a half-marathon later this year, runs most mornings before work.', 'AAG memory synthesis', '5 source interactions', '2025-12-06'),
  ('aag-memory-CL-0083', 'CL-0083', 'profile', 'Consolidated client memory', 'Nurhaliza binti Mahmud is a 56-year-old real estate agent, a client since March 2025 (1 year). Single. Has 1 child: Zulkifli (son, age 9).', 'Nurhaliza binti Mahmud is a 56-year-old real estate agent, a client since March 2025 (1 year). Single. Has 1 child: Zulkifli (son, age 9).

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is moderate, investment horizon roughly 8 years. Liabilities: mortgage only. Currently holds: Critical Illness (renews May 2026).

Mentioned in October 2025: Recently purchased a new home.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed March 2025. Last direct contact was March 2026, 100 days ago. She plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '4 source interactions', '2026-03-12'),
  ('aag-memory-CL-0084', 'CL-0084', 'profile', 'Consolidated client memory', 'Loh Boon Keat is a 25-year-old management consultant, a client since December 2024 (1 year). Divorced. Has 2 children: Su Ann (daughter, age 5); Pei Shan (son, age 2). Originally a cold outreach contact.', 'Loh Boon Keat is a 25-year-old management consultant, a client since December 2024 (1 year). Divorced. Has 2 children: Su Ann (daughter, age 5); Pei Shan (son, age 2). Originally a cold outreach contact.

Falls in the RM250k-400k income bracket with an estimated net worth of RM8M+. Risk tolerance is aggressive, investment horizon roughly 13 years. Liabilities: mortgage, education loan. Currently holds: Medical (renews May 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed January 2025. Last direct contact was December 2025, 188 days ago. She is into specialty coffee, has strong opinions about pour-over versus espresso.', 'AAG memory synthesis', '2 source interactions', '2025-12-14'),
  ('aag-memory-CL-0085', 'CL-0085', 'profile', 'Consolidated client memory', 'Hisyam bin Othman is a 61-year-old management consultant, a client since January 2019 (7 years). Has 1 child: Siti Khadijah (daughter, age 40). Came in through a referral from an existing client.', 'Hisyam bin Othman is a 61-year-old management consultant, a client since January 2019 (7 years). Has 1 child: Siti Khadijah (daughter, age 40). Came in through a referral from an existing client.

Falls in the RM48k-80k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is moderate, investment horizon roughly 5 years. Liabilities: mortgage, education loan. Currently holds: Medical (renews February 2027); Investment-linked (renews November 2026); Life (renews February 2027).

Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed August 2025. Last direct contact was January 2026, 163 days ago. He is a durian enthusiast with strong opinions about which orchard has the best Musang King. He has been learning to play the guitar over the past year, mostly self-taught from online videos.', 'AAG memory synthesis', '4 source interactions', '2026-01-08'),
  ('aag-memory-CL-0086', 'CL-0086', 'profile', 'Consolidated client memory', 'Wong Mei Ling is a 29-year-old architect, a client since October 2020 (5 years). Married to Boon Keat. Has 1 child: Choon Hong (daughter, age 2). Originally a cold outreach contact.', 'Wong Mei Ling is a 29-year-old architect, a client since October 2020 (5 years). Married to Boon Keat. Has 1 child: Choon Hong (daughter, age 2). Originally a cold outreach contact.

Falls in the RM150k-250k income bracket with an estimated net worth of RM3M-8M. Risk tolerance is aggressive, investment horizon roughly 16 years. Liabilities: mortgage, car loan. Currently holds: Critical Illness (renews February 2027).

Mentioned in December 2025: Newly promoted, income increasing.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed December 2024. Last direct contact was December 2025, 181 days ago. He recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '3 source interactions', '2025-12-21'),
  ('aag-memory-CL-0087', 'CL-0087', 'profile', 'Consolidated client memory', 'Azman bin Bakar is a 25-year-old operations manager, a client since November 2021 (4 years). Single. Has 2 children: Mohd Hafiz (son, age 2); Siti Aminah (daughter, age 3).', 'Azman bin Bakar is a 25-year-old operations manager, a client since November 2021 (4 years). Single. Has 2 children: Mohd Hafiz (son, age 2); Siti Aminah (daughter, age 3).

Falls in the RM48k-80k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 10 years. Liabilities: car loan only. Currently holds: Critical Illness (renews March 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed June 2025. Last direct contact was March 2026, 105 days ago. He has been learning to play the guitar over the past year, mostly self-taught from online videos. He recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '2 source interactions', '2026-03-07'),
  ('aag-memory-CL-0088', 'CL-0088', 'profile', 'Consolidated client memory', 'Tan Yong Jie is a 45-year-old operations manager, a client since January 2025 (1 year). Single. Has 2 children: Hui Min (son, age 2); Su Ann (daughter, age 25). Acquired through a corporate event.', 'Tan Yong Jie is a 45-year-old operations manager, a client since January 2025 (1 year). Single. Has 2 children: Hui Min (son, age 2); Su Ann (daughter, age 25). Acquired through a corporate event.

Falls in the RM150k-250k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 4 years. Liabilities: none outstanding. Currently holds: Education Savings (renews December 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Has a will in place. Fact-find last completed May 2025. Last direct contact was April 2026, 78 days ago. He recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '3 source interactions', '2026-04-03'),
  ('aag-memory-CL-0089', 'CL-0089', 'profile', 'Consolidated client memory', 'Tan Boon Keat is a 33-year-old secondary school teacher, a client since September 2024 (1 year). Single. Originally a cold outreach contact.', 'Tan Boon Keat is a 33-year-old secondary school teacher, a client since September 2024 (1 year). Single. Originally a cold outreach contact.

Falls in the RM48k-80k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 10 years. Liabilities: none outstanding. Currently holds: Investment-linked (renews May 2026); Critical Illness (renews January 2027); Medical (renews September 2026).

Mentioned in May 2026: Considering a career change. Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed January 2025. Last direct contact was June 2026, 8 days ago. She is learning Mandarin in spare time, says it helps with business dealings. She plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '5 source interactions', '2026-06-12'),
  ('aag-memory-CL-0090', 'CL-0090', 'profile', 'Consolidated client memory', 'Suraya binti Zainal is a 25-year-old business owner, a client since April 2025 (1 year). Married to Hisyam. Has 2 children: Noraini (daughter, age 0); Aisyah (daughter, age 2). Originally a cold outreach contact.', 'Suraya binti Zainal is a 25-year-old business owner, a client since April 2025 (1 year). Married to Hisyam. Has 2 children: Noraini (daughter, age 0); Aisyah (daughter, age 2). Originally a cold outreach contact.

Falls in the RM150k-250k income bracket with an estimated net worth of Below RM250k. Risk tolerance is moderate, investment horizon roughly 15 years. Liabilities: mortgage, car loan. Currently holds: Medical (renews August 2026); Life (renews May 2027); Medical (renews March 2027).

Mentioned in March 2026: Inherited a sum from a late relative.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed March 2025. Last direct contact was March 2026, 81 days ago. She is a big fan of Korean dramas, usually has one running in the background most evenings. She is an avid weekend cyclist, recently completed a 100km charity ride.', 'AAG memory synthesis', '3 source interactions', '2026-03-31'),
  ('aag-memory-CL-0091', 'CL-0091', 'profile', 'Consolidated client memory', 'Lee Cheng Hoe is a 29-year-old restaurant owner, a client since April 2019 (7 years). Married to Li Wen. Came in through a referral from an existing client.', 'Lee Cheng Hoe is a 29-year-old restaurant owner, a client since April 2019 (7 years). Married to Li Wen. Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 3 years. Liabilities: car loan only. Currently holds: Medical (renews February 2027); Medical (renews December 2026).

Mentioned in January 2026: Expecting first child — expected to become relevant again around August 2026.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed April 2025. Last direct contact was January 2026, 153 days ago. She has been learning to play the guitar over the past year, mostly self-taught from online videos. She used to play competitive badminton at state level back in school.', 'AAG memory synthesis', '2 source interactions', '2026-01-18'),
  ('aag-memory-CL-0092', 'CL-0092', 'profile', 'Consolidated client memory', 'Teh Choon Hong is a 45-year-old logistics manager, a client since September 2022 (3 years). Married to Mei Ling. Has 3 children: Yong Jie (son, age 12); Hui Min (son, age 16); Pei Shan (daughter, age 14).', 'Teh Choon Hong is a 45-year-old logistics manager, a client since September 2022 (3 years). Married to Mei Ling. Has 3 children: Yong Jie (son, age 12); Hui Min (son, age 16); Pei Shan (daughter, age 14).

Falls in the RM80k-150k income bracket with an estimated net worth of Below RM250k. Risk tolerance is conservative, investment horizon roughly 25 years. Liabilities: none outstanding. Currently holds: General Insurance (renews January 2027); Education Savings (renews May 2027).

No notable life events or preferences have surfaced in past interactions yet.

Prefers Email for contact. Has a will in place. Fact-find last completed December 2024. Last direct contact was March 2025, 454 days ago. He keeps a small herb garden on the balcony and swaps cuttings with neighbours. He is learning Mandarin in spare time, says it helps with business dealings.', 'AAG memory synthesis', '1 source interactions', '2025-03-23'),
  ('aag-memory-CL-0093', 'CL-0093', 'profile', 'Consolidated client memory', 'Loh Pei Shan is a 65-year-old logistics manager, a client since May 2020 (6 years). Married to Su Ann. Has 3 children: Hui Min (son, age 45); Wei Ling (daughter, age 19); Wen Jun (daughter, age 39).', 'Loh Pei Shan is a 65-year-old logistics manager, a client since May 2020 (6 years). Married to Su Ann. Has 3 children: Hui Min (son, age 45); Wei Ling (daughter, age 19); Wen Jun (daughter, age 39).

Falls in the RM400k+ income bracket with an estimated net worth of RM8M+. Risk tolerance is conservative, investment horizon roughly 22 years. Liabilities: business loan. Currently holds: Critical Illness (renews January 2027); Education Savings (renews May 2026).

Mentioned in December 2025: Planning early retirement — expected to become relevant again around April 2026. Mentioned in December 2025: Wei Ling starting university — expected to become relevant again around April 2026.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed June 2025. Last direct contact was December 2025, 184 days ago. He has been learning to play the guitar over the past year, mostly self-taught from online videos. He keeps a small herb garden on the balcony and swaps cuttings with neighbours.', 'AAG memory synthesis', '3 source interactions', '2025-12-18'),
  ('aag-memory-CL-0094', 'CL-0094', 'profile', 'Consolidated client memory', 'Suraya binti Hassan is a 38-year-old civil servant, a client since August 2023 (2 years). Married to Shahrul Nizam.', 'Suraya binti Hassan is a 38-year-old civil servant, a client since August 2023 (2 years). Married to Shahrul Nizam.

Falls in the RM150k-250k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is conservative, investment horizon roughly 6 years. Liabilities: none outstanding. Currently holds: Life (renews January 2027); Education Savings (renews October 2026).

Mentioned in February 2026: Recently purchased a new home. Mentioned in February 2026: Planning to relocate overseas for work — expected to become relevant again around July 2026. Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers Phone call for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed June 2025. Last direct contact was February 2026, 120 days ago. She is an avid weekend cyclist, recently completed a 100km charity ride. She plays badminton in a weekly league with old university friends.', 'AAG memory synthesis', '5 source interactions', '2026-02-20'),
  ('aag-memory-CL-0095', 'CL-0095', 'profile', 'Consolidated client memory', 'Mahesh a/l Nair is a 62-year-old entrepreneur, a client since October 2019 (6 years). Married to Priya. Has 2 children: Shanthi (daughter, age 9); Senthil (son, age 26).', 'Mahesh a/l Nair is a 62-year-old entrepreneur, a client since October 2019 (6 years). Married to Priya. Has 2 children: Shanthi (daughter, age 9); Senthil (son, age 26).

Falls in the RM150k-250k income bracket with an estimated net worth of RM250k-1M. Risk tolerance is conservative, investment horizon roughly 9 years. Liabilities: none outstanding. Currently holds: Investment-linked (renews June 2026); Investment-linked (renews November 2026).

No notable life events or preferences have surfaced in past interactions yet.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed February 2025. Last direct contact was April 2023, 1166 days ago. He has been learning to play the guitar over the past year, mostly self-taught from online videos. He collects vinyl records, mostly 80s Cantopop and jazz.', 'AAG memory synthesis', '2 source interactions', '2023-04-11'),
  ('aag-memory-CL-0096', 'CL-0096', 'profile', 'Consolidated client memory', 'Mahesh a/l Nair is a 66-year-old lawyer, a client since October 2024 (1 year). Married to Shanthi. Has 3 children: Vimal (son, age 33); Raj Kumar (son, age 45); Ganesh (son, age 2).', 'Mahesh a/l Nair is a 66-year-old lawyer, a client since October 2024 (1 year). Married to Shanthi. Has 3 children: Vimal (son, age 33); Raj Kumar (son, age 45); Ganesh (son, age 2).

Falls in the RM400k+ income bracket with an estimated net worth of RM1M-3M. Risk tolerance is aggressive, investment horizon roughly 12 years. Liabilities: mortgage, car loan. Currently holds: Medical (renews November 2026).

Mentioned in January 2026: Aging parents need medical care support — expected to become relevant again around June 2026. Also worth noting (preference): Prefers conservative options, mentioned losing money in a past market downturn and being cautious since.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed March 2026. Last direct contact was May 2026, 40 days ago. He has a rescue dog that often comes up in conversation.', 'AAG memory synthesis', '4 source interactions', '2026-05-11'),
  ('aag-memory-CL-0097', 'CL-0097', 'profile', 'Consolidated client memory', 'Khairul Anwar bin Karim is a 65-year-old real estate agent, a client since November 2024 (1 year). Married to Wan Aishah. Has 3 children: Nasrul (son, age 21); Mohd Syafiq (son, age 34); Mohd Hafiz (son, age 29). Acquired through a corporate event.', 'Khairul Anwar bin Karim is a 65-year-old real estate agent, a client since November 2024 (1 year). Married to Wan Aishah. Has 3 children: Nasrul (son, age 21); Mohd Syafiq (son, age 34); Mohd Hafiz (son, age 29). Acquired through a corporate event.

Falls in the RM48k-80k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is moderate, investment horizon roughly 24 years. Liabilities: mortgage, education loan. Currently holds: Medical (renews September 2026); Critical Illness (renews August 2026).

Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Email for contact. Does not yet have a will in place; estate planning is completed. Fact-find last completed January 2025. Last direct contact was March 2026, 107 days ago. He is training for a half-marathon later this year, runs most mornings before work. He is a karaoke regular, says it''s the best way to unwind after a long week.', 'AAG memory synthesis', '3 source interactions', '2026-03-05'),
  ('aag-memory-CL-0098', 'CL-0098', 'profile', 'Consolidated client memory', 'Loh Xin Yi is a 50-year-old lawyer, a client since October 2019 (6 years). Single. Has 2 children: Mei Yee (son, age 7); Wen Jun (daughter, age 23). Came in through a referral from an existing client.', 'Loh Xin Yi is a 50-year-old lawyer, a client since October 2019 (6 years). Single. Has 2 children: Mei Yee (son, age 7); Wen Jun (daughter, age 23). Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is moderate, investment horizon roughly 8 years. Liabilities: car loan only. Currently holds: Life (renews May 2027).

Mentioned in June 2026: Aging parents need medical care support — expected to become relevant again around February 2027.

Prefers Email for contact. Does not yet have a will in place; estate planning is none. Fact-find last completed November 2024. Last direct contact was June 2026, 15 days ago. She is a big fan of Korean dramas, usually has one running in the background most evenings. She recently picked up baking, has been perfecting a sourdough recipe.', 'AAG memory synthesis', '3 source interactions', '2026-06-05'),
  ('aag-memory-CL-0099', 'CL-0099', 'profile', 'Consolidated client memory', 'Lim Hui Min is a 63-year-old dentist, a client since July 2018 (7 years). Married to Kai Xin. Has 1 child: Jun Wei (daughter, age 25).', 'Lim Hui Min is a 63-year-old dentist, a client since July 2018 (7 years). Married to Kai Xin. Has 1 child: Jun Wei (daughter, age 25).

Falls in the RM80k-150k income bracket with an estimated net worth of RM8M+. Risk tolerance is moderate, investment horizon roughly 7 years. Liabilities: mortgage only. Currently holds: Investment-linked (renews December 2026); Life (renews June 2026); General Insurance (renews December 2026).

Mentioned in October 2025: Aging parents need medical care support — expected to become relevant again around August 2026.

Prefers WhatsApp for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed May 2025. Last direct contact was October 2025, 247 days ago. She keeps tropical fish as a hobby, with a fairly elaborate home aquarium setup.', 'AAG memory synthesis', '3 source interactions', '2025-10-16'),
  ('aag-memory-CL-0100', 'CL-0100', 'profile', 'Consolidated client memory', 'Koh Mei Ling is a 63-year-old medical doctor, a client since December 2019 (6 years). Widowed. Has 3 children: Mei Yee (son, age 29); Jun Wei (daughter, age 15); Jia Hao (daughter, age 37). Came in through a referral from an existing client.', 'Koh Mei Ling is a 63-year-old medical doctor, a client since December 2019 (6 years). Widowed. Has 3 children: Mei Yee (son, age 29); Jun Wei (daughter, age 15); Jia Hao (daughter, age 37). Came in through a referral from an existing client.

Falls in the RM250k-400k income bracket with an estimated net worth of RM1M-3M. Risk tolerance is moderate, investment horizon roughly 19 years. Liabilities: business loan. Currently holds: Investment-linked (renews October 2026).

Mentioned in March 2026: Jia Hao diagnosed with a health condition requiring ongoing care — expected to become relevant again around February 2027. Also worth noting (preference): Prefers WhatsApp over email, says he rarely checks email outside work hours.

Prefers Email for contact. Does not yet have a will in place; estate planning is in progress. Fact-find last completed November 2024. Last direct contact was March 2026, 84 days ago. He has a rescue dog that often comes up in conversation.', 'AAG memory synthesis', '5 source interactions', '2026-03-28')
on conflict (id) do update set
  customer_id = excluded.customer_id,
  kind = excluded.kind,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  source_name = excluded.source_name,
  source_meta = excluded.source_meta,
  created_at = excluded.created_at;
