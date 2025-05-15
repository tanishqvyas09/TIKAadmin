'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  weight: number;
  registered_association: string;
  state: string;
}

interface Event {
  id: string;
  title: string;
  state: string;
  city: string;
  age: number;
  weight_category: string;
  fees: number;
  gender: string;
}

interface Application {
  id: string;
  player_id: string;
  event_id: string;
  status: string;
  created_at: string;
  events: Event;
  players: Player;
}

export default function EventApplicationsPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlayers();
    fetchEvents();
    fetchApplications();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('first_name');

    if (error) {
      console.error('Error fetching players:', error);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  }

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  }

  async function fetchApplications() {
    const { data, error } = await supabase
      .from('player_event_applications')
      .select(`
        *,
        events (*),
        players (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      setApplications(data || []);
    }
  }

  async function applyForEvent() {
    if (!selectedPlayer || !selectedEvent) return;

    // Check if already applied
    const existingApplication = applications.find(
      app => app.player_id === selectedPlayer && app.event_id === selectedEvent
    );

    if (existingApplication) {
      alert('You have already applied for this event.');
      return;
    }

    const { error } = await supabase
      .from('player_event_applications')
      .insert([{
        player_id: selectedPlayer,
        event_id: selectedEvent,
        status: 'pending'
      }]);

    if (error) {
      console.error('Error applying for event:', error);
      alert('There was a problem with your application');
    } else {
      fetchApplications();
      setSelectedPlayer('');
      setSelectedEvent('');
    }
  }

  function getFilteredPlayers() {
    if (!searchTerm) return players;

    const term = searchTerm.toLowerCase();
    return players.filter(
      player => 
        player.first_name.toLowerCase().includes(term) || 
        player.last_name.toLowerCase().includes(term) ||
        player.registered_association.toLowerCase().includes(term)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Event Applications</h2>
        <Link href="/players">
          <Button variant="outline">Back to Players</Button>
        </Link>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-medium mb-4">Apply for an Event</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="player-search">Search Player</Label>
            <Input
              id="player-search"
              placeholder="Search by name or association"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-64 overflow-y-auto border rounded p-2">
              {getFilteredPlayers().length === 0 ? (
                <p className="text-center p-4 text-muted-foreground">No matching players</p>
              ) : (
                getFilteredPlayers().map(player => (
                  <div 
                    key={player.id} 
                    className={`p-2 cursor-pointer hover:bg-accent rounded ${selectedPlayer === player.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedPlayer(player.id)}
                  >
                    <p className="font-medium">{player.first_name} {player.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.registered_association} • {player.state} • {player.weight} kg
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="event-select">Select Event</Label>
            <Select 
              value={selectedEvent} 
              onValueChange={setSelectedEvent}
            >
              <SelectTrigger id="event-select">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} ({event.weight_category}, {event.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={applyForEvent}
              className="w-full mt-4"
              disabled={!selectedPlayer || !selectedEvent}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Card>

      <h3 className="text-xl font-medium mt-8">Your Applications</h3>
      {applications.length === 0 ? (
        <p className="text-center p-4 text-muted-foreground">No applications found</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map(app => (
            <Card key={app.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{app.events.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {app.events.weight_category} • {app.events.gender}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Player: </span>
                  {app.players.first_name} {app.players.last_name}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Association: </span>
                  {app.players.registered_association}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">State: </span>
                  {app.players.state}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Applied on: </span>
                  {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 