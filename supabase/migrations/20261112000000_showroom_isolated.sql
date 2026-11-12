-- Starpoint Showroom: standalone database schema.
-- Apply ONLY to a NEW dedicated Supabase project. Never run in the APK's project.
-- No references to staff_profiles, staff_access, bookings, members, technicians, or APK owner.
create extension if not exists pgcrypto;

create table public.showroom_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'owner' check (role='owner'),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create unique index showroom_only_one_owner on public.showroom_access ((role)) where role='owner' and active;

create table public.showroom_motorcycles (
 id uuid primary key default gen_random_uuid(),
 unit_code text not null default '',
 brand text not null default '',
 model text not null default '',
 variant text not null default '',
 model_year int check(model_year between 1900 and 2100),
 odometer_km int check(odometer_km>=0),
 plate_no text not null default '',
 chassis_no text not null default '',
 purchase_date date not null default current_date,
 purchase_price numeric(16,2) not null default 0 check(purchase_price>=0),
 target_sale_price numeric(16,2) not null default 0 check(target_sale_price>=0),
 actual_sale_price numeric(16,2) check(actual_sale_price>=0),
 sold_date date,
 status text not null default 'stock' check(status in ('stock','work','ready','sold','archived')),
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint showroom_sold_requires_sale_details check(status<>'sold' or (actual_sale_price>0 and sold_date is not null))
);
create table public.showroom_tasks (
 id uuid primary key default gen_random_uuid(),
 motor_id uuid not null references public.showroom_motorcycles(id) on delete cascade,
 title text not null check(length(trim(title))>0),
 notes text not null default '',
 priority text not null default 'normal' check(priority in ('low','normal','high')),
 status text not null default 'todo' check(status in ('todo','doing','done')),
 due_date date,
 estimated_cost numeric(16,2) not null default 0 check(estimated_cost>=0),
 actual_cost numeric(16,2) not null default 0 check(actual_cost>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.showroom_parts (
 id uuid primary key default gen_random_uuid(),
 motor_id uuid not null references public.showroom_motorcycles(id) on delete cascade,
 name text not null check(length(trim(name))>0),
 part_code text not null default '',
 quantity int not null default 1 check(quantity>0),
 unit_cost numeric(16,2) not null default 0 check(unit_cost>=0),
 estimated_sale_price numeric(16,2) not null default 0 check(estimated_sale_price>=0),
 actual_sale_price numeric(16,2) not null default 0 check(actual_sale_price>=0),
 qty_sold int not null default 0 check(qty_sold>=0 and qty_sold<=quantity),
 purpose text not null default 'maintenance' check(purpose in ('maintenance','resale')),
 status text not null default 'planned' check(status in ('planned','purchased','installed','sold')),
 purchase_date date,
 sold_date date,
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint showroom_part_sales_require_details check(qty_sold=0 or (purpose='resale' and status<>'planned' and actual_sale_price>0 and sold_date is not null))
);
create table public.showroom_expenses (
 id uuid primary key default gen_random_uuid(),
 motor_id uuid not null references public.showroom_motorcycles(id) on delete cascade,
 category text not null default 'lainnya',
 title text not null check(length(trim(title))>0),
 amount numeric(16,2) not null check(amount>=0),
 expense_date date not null default current_date,
 is_planned boolean not null default false,
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.showroom_capital (
 id uuid primary key default gen_random_uuid(),
 person_name text not null check(length(trim(person_name))>0),
 entry_type text not null check(entry_type in ('deposit','withdrawal')),
 amount numeric(16,2) not null check(amount>0),
 entry_date date not null default current_date,
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.showroom_photos (
 id uuid primary key default gen_random_uuid(),
 motor_id uuid references public.showroom_motorcycles(id) on delete cascade,
 part_id uuid references public.showroom_parts(id) on delete cascade,
 storage_path text not null unique,
 caption text not null default '',
 created_at timestamptz not null default now(),
 constraint showroom_photo_belongs_to_one_entity
 check((motor_id is not null and part_id is null) or (motor_id is null and part_id is not null))
);
create table public.showroom_activity (
 id bigint generated always as identity primary key,
 entity text not null,
 entity_id uuid not null,
 motor_id uuid,
 operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
 before_data jsonb,
 after_data jsonb,
 actor_id uuid,
 created_at timestamptz not null default now()
);
create index showroom_tasks_motor_idx on public.showroom_tasks(motor_id);
create index showroom_parts_motor_idx on public.showroom_parts(motor_id);
create index showroom_expenses_motor_idx on public.showroom_expenses(motor_id);
create index showroom_photos_motor_idx on public.showroom_photos(motor_id);
create index showroom_photos_part_idx on public.showroom_photos(part_id);
create index showroom_motorcycles_status_idx on public.showroom_motorcycles(status);
create index showroom_activity_motor_idx on public.showroom_activity(motor_id,created_at desc);

create schema if not exists showroom_internal;
revoke all on schema showroom_internal from public, anon, authenticated;
create function showroom_internal.is_owner()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
  select 1 from public.showroom_access
  where user_id=auth.uid() and role='owner' and active=true
 );
$$;
revoke all on function showroom_internal.is_owner() from public, anon, authenticated;
-- Public policy expressions use a non-leaking inline subquery against showroom_access,
-- which has a self-read policy restricted to auth.uid().
alter table public.showroom_access enable row level security;
create policy showroom_access_self_read on public.showroom_access for select to authenticated
using (user_id=(select auth.uid()) and active);
-- Access grants are server-admin only; no client may grant itself the Owner role.
revoke all on public.showroom_access from anon;
grant select on public.showroom_access to authenticated;

create function showroom_internal.touch_updated_at()
returns trigger language plpgsql security invoker set search_path='' as $$
 begin new.updated_at=now();return new;end;
$$;
create function showroom_internal.capture_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare before_row jsonb;after_row jsonb;rid uuid;mid uuid;
begin
 if not exists (select 1 from public.showroom_access a
                where a.user_id=auth.uid() and a.active and a.role='owner') then
   raise exception 'SHOWROOM_NOT_AUTHORIZED';
 end if;
 before_row:=case when TG_OP='INSERT' then null else to_jsonb(OLD) end;
 after_row:=case when TG_OP='DELETE' then null else to_jsonb(NEW) end;
 rid:=coalesce((after_row->>'id')::uuid,(before_row->>'id')::uuid);
 mid:=case when TG_TABLE_NAME='showroom_motorcycles' then rid
            else coalesce((after_row->>'motor_id')::uuid,(before_row->>'motor_id')::uuid) end;
 insert into public.showroom_activity(entity,entity_id,motor_id,operation,before_data,after_data,actor_id)
 values(TG_TABLE_NAME,rid,mid,TG_OP,before_row,after_row,auth.uid());
 if TG_OP='DELETE' then return OLD;end if;
 return NEW;
end;
$$;
revoke all on function showroom_internal.capture_change() from public,anon,authenticated;
revoke all on function showroom_internal.touch_updated_at() from public,anon,authenticated;

do $$
declare t text;
declare predicate text:='exists(select 1 from public.showroom_access a where a.user_id=(select auth.uid()) and a.active and a.role=''owner'')';
begin
 foreach t in array array['showroom_motorcycles','showroom_tasks','showroom_parts','showroom_expenses','showroom_capital','showroom_photos'] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from anon',t);
   execute format('grant select,insert,update,delete on public.%I to authenticated',t);
   execute format('create policy %I on public.%I for select to authenticated using (%s)',t||'_owner_read',t,predicate);
   execute format('create policy %I on public.%I for insert to authenticated with check (%s)',t||'_owner_create',t,predicate);
   execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)',t||'_owner_update',t,predicate,predicate);
   if t <> 'showroom_motorcycles' then
     execute format('create policy %I on public.%I for delete to authenticated using (%s)',t||'_owner_delete',t,predicate);
   end if;
   if t in ('showroom_motorcycles','showroom_tasks','showroom_parts','showroom_expenses','showroom_capital') then
     execute format('create trigger showroom_updated before update on public.%I for each row execute function showroom_internal.touch_updated_at()',t);
   end if;
   execute format('create trigger showroom_audit after insert or update or delete on public.%I for each row execute function showroom_internal.capture_change()',t);
 end loop;
end $$;
alter table public.showroom_activity enable row level security;
create policy showroom_activity_owner_read on public.showroom_activity for select to authenticated
using (exists(select 1 from public.showroom_access a where a.user_id=(select auth.uid()) and a.active and a.role='owner'));
revoke all on public.showroom_activity from anon;
grant select on public.showroom_activity to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('showroom-private','showroom-private',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy showroom_storage_select on storage.objects for select to authenticated
using(bucket_id='showroom-private' and exists(select 1 from public.showroom_access a where a.user_id=(select auth.uid()) and a.active and a.role='owner'));
create policy showroom_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='showroom-private' and exists(select 1 from public.showroom_access a where a.user_id=(select auth.uid()) and a.active and a.role='owner'));
create policy showroom_storage_delete on storage.objects for delete to authenticated
using(bucket_id='showroom-private' and exists(select 1 from public.showroom_access a where a.user_id=(select auth.uid()) and a.active and a.role='owner'));

alter publication supabase_realtime add table
 public.showroom_motorcycles,public.showroom_tasks,public.showroom_parts,
 public.showroom_expenses,public.showroom_capital,public.showroom_photos,public.showroom_activity;
