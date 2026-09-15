'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Plus, ShieldCheck, Store, UserCog } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Boutique, RoleUtilisateur, Utilisateur } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const ROLE_LABELS: Record<RoleUtilisateur, string> = {
  ADMIN_RH: 'Admin RH',
  DIRECTEUR_REGIONAL: 'Directeur Régional',
  GERANT: 'Gérant(e)',
};

const ROLE_ICONS: Record<RoleUtilisateur, typeof UserCog> = {
  ADMIN_RH: UserCog,
  DIRECTEUR_REGIONAL: ShieldCheck,
  GERANT: Store,
};

export function UtilisateursPanel() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState<RoleUtilisateur>('GERANT');
  const [boutiqueId, setBoutiqueId] = useState('');

  const { data: utilisateurs } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: () => api.get<Utilisateur[]>('/users'),
  });
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => api.get<Boutique[]>('/boutiques'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/users', {
        email,
        motDePasse,
        role,
        boutiqueId: role === 'GERANT' ? boutiqueId : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
      setOpen(false);
      setEmail('');
      setMotDePasse('');
      setBoutiqueId('');
    },
  });

  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) => api.patch(`/users/${id}`, { actif }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['utilisateurs'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="motDePasse">Mot de passe</Label>
                <Input
                  id="motDePasse"
                  type="password"
                  minLength={8}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={(v) => setRole(v as RoleUtilisateur)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {role === 'GERANT' && (
                <div className="flex flex-col gap-1.5">
                  <Label>Boutique</Label>
                  <Select value={boutiqueId} onValueChange={setBoutiqueId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une boutique" />
                    </SelectTrigger>
                    <SelectContent>
                      {boutiques?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={createMutation.isPending || (role === 'GERANT' && !boutiqueId)}>
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Boutique</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilisateurs?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck
                      className={`h-3.5 w-3.5 shrink-0 ${u.actif ? 'text-success' : 'text-text-muted'}`}
                      strokeWidth={2}
                    />
                    {u.email}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {(() => {
                      const RoleIcon = ROLE_ICONS[u.role];
                      return <RoleIcon className="h-3.5 w-3.5 shrink-0 text-brand-primary" strokeWidth={2} />;
                    })()}
                    {ROLE_LABELS[u.role]}
                  </span>
                </TableCell>
                <TableCell>{boutiques?.find((b) => b.id === u.boutiqueId)?.nom ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActifMutation.mutate({ id: u.id, actif: !u.actif })}
                  >
                    {u.actif ? 'Désactiver' : 'Activer'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
