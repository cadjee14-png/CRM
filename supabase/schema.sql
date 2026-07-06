-- Nourian CRM — Schema Supabase
-- Coller dans SQL Editor de ton projet Supabase

-- Table clients
create table clients (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  prenom text not null,
  email text,
  telephone text,
  created_at timestamptz default now()
);

-- Table vehicules
create table vehicules (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  marque text not null,
  modele text not null,
  type_relation text not null check (type_relation in ('achat', 'revision')),
  date_achat date,
  date_derniere_revision date,
  created_at timestamptz default now()
);

-- Table alertes
create table alertes (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  vehicule_id uuid references vehicules(id) on delete cascade not null,
  type text not null check (type in ('revision', 'renouvellement')),
  date_echeance date not null,
  statut text default 'pending' check (statut in ('pending', 'fait', 'snooze')),
  note text,
  created_at timestamptz default now()
);

-- RLS
alter table clients enable row level security;
alter table vehicules enable row level security;
alter table alertes enable row level security;

-- Policies : accès complet pour les utilisateurs authentifiés
create policy "Auth users full access" on clients for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on vehicules for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on alertes for all using (auth.role() = 'authenticated');

-- Index pour les performances
create index on vehicules(client_id);
create index on alertes(client_id);
create index on alertes(statut);
create index on alertes(date_echeance);
