'use client';

import { ThemeToggle } from './components/ThemeToggle';

import { useEffect, useState, useMemo } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconSun, IconMoonStars, IconPlus, IconEdit, IconTrash, IconLink } from '@tabler/icons-react';

type BuyIn = {
  amount: number;
  method: string;
};

type Player = {
  name: string;
  buyIns: BuyIn[];
};

const paymentMethods = ['Cash', 'Venmo', 'Zelle', 'Apple Pay', 'CashApp', 'Custom'];

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [initialBuyIn, setInitialBuyIn] = useState<number>(0);
  const [globalBuyInSet, setGlobalBuyInSet] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [editingBuyIn, setEditingBuyIn] = useState<{
    
    playerIndex: number;
    buyInIndex: number;
    amount: number;
    method: string;
    customMethod: string;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [quickAddPlayerIndex, setQuickAddPlayerIndex] = useState<number | null>(null);
  const [quickAddMethod, setQuickAddMethod] = useState(paymentMethods[0]);
  const [quickAddCustomMethod, setQuickAddCustomMethod] = useState('');
  const [isClient, setIsClient] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const savedData = localStorage.getItem('pokerBuyInsData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.players) setPlayers(parsedData.players);
          if (parsedData.initialBuyIn !== undefined) setInitialBuyIn(parsedData.initialBuyIn);
          if (parsedData.globalBuyInSet !== undefined) setGlobalBuyInSet(parsedData.globalBuyInSet);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }, [isClient]);

  useEffect(() => {
    // Save to localStorage whenever players, initialBuyIn, or globalBuyInSet changes
    localStorage.setItem('pokerBuyInsData', JSON.stringify({ players, initialBuyIn, globalBuyInSet }));
  }, [players, initialBuyIn, globalBuyInSet]);

  const addPlayer = () => {
    if (newPlayerName.trim() === '') return;
    setPlayers((prev) => [...prev, { name: newPlayerName.trim(), buyIns: [] }]);
    setNewPlayerName('');
  };

  const applyGlobalBuyIn = () => {
    if (initialBuyIn <= 0) return;
    const updatedPlayers = players.map((p) => ({
      ...p,
      buyIns: [...p.buyIns, { amount: initialBuyIn, method: 'Cash' }],
    }));
    setPlayers(updatedPlayers);
    setGlobalBuyInSet(true);
  };

  const addBuyInToPlayer = (playerIndex: number, amount: number, method: string) => {
    if (amount <= 0) return;
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        buyIns: [...newPlayers[playerIndex].buyIns, { amount, method }],
      };
      return newPlayers;
    });
  };

  const startEditBuyIn = (playerIndex: number, buyInIndex: number) => {
    const buyIn = players[playerIndex].buyIns[buyInIndex];
    let method = paymentMethods.includes(buyIn.method) ? buyIn.method : 'Custom';
    let customMethod = !paymentMethods.includes(buyIn.method) ? buyIn.method : '';
    setEditingBuyIn({ playerIndex, buyInIndex, amount: buyIn.amount, method, customMethod });
  };

  const saveEditBuyIn = () => {
    if (!editingBuyIn) return;
    const { playerIndex, buyInIndex, amount, method, customMethod } = editingBuyIn;
    if (amount <= 0) {
      setEditingBuyIn(null);
      return;
    }
    const finalMethod = method === 'Custom' && customMethod.trim() !== '' ? customMethod : method;
    setPlayers((prev) => {
      const newPlayers = [...prev];
      const updatedBuyIns = [...newPlayers[playerIndex].buyIns];
      updatedBuyIns[buyInIndex] = { amount, method: finalMethod };
      newPlayers[playerIndex].buyIns = updatedBuyIns;
      return newPlayers;
    });
    setEditingBuyIn(null);
  };

  const deleteBuyInOfPlayer = (playerIndex: number, buyInIndex: number) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      const updatedBuyIns = [...newPlayers[playerIndex].buyIns];
      updatedBuyIns.splice(buyInIndex, 1);
      newPlayers[playerIndex].buyIns = updatedBuyIns;
      return newPlayers;
    });
  };

  const handleGenerateShareLink = async () => {
    // Call API to save data and generate a shareable ID
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        players,
        initialBuyIn,
        globalBuyInSet,
      }),
    });
    const data = await response.json();
    if (data.id) {
      const url = `${window.location.origin}/${data.id}`;
      setShareLink(url);
      setShowShareModal(true);
    }
  };

  const handleQuickAdd = (playerIndex: number) => {
    if (!globalBuyInSet) return;
    const finalMethod =
      quickAddMethod === 'Custom' && quickAddCustomMethod.trim() !== ''
        ? quickAddCustomMethod
        : quickAddMethod;
    addBuyInToPlayer(playerIndex, initialBuyIn, finalMethod);
    setQuickAddCustomMethod('');
    setQuickAddMethod(paymentMethods[0]);
    setQuickAddPlayerIndex(null);
  };

  // Compute totals
  const totalsByMethod = useMemo(() => {
    const totals: Record<string, number> = {};
    players.forEach((player) => {
      player.buyIns.forEach((bi) => {
        const method = bi.method;
        if (!totals[method]) totals[method] = 0;
        totals[method] += bi.amount;
      });
    });
    return totals;
  }, [players]);

  const totalInPlay = useMemo(() => {
    return Object.values(totalsByMethod).reduce((acc, val) => acc + val, 0);
  }, [totalsByMethod]);

  function roundToAllowedDenomination(value: number): number {
    const allowedDenominations = [0.1, 0.25, 0.5, 1];
    // Round value to closest allowed denomination:
    // If value <= 1, use these denominations. If > 1, round to nearest whole number.
    if (value <= 1) {
      let closest = 0.1;
      let minDiff = Math.abs(value - 0.1);
      for (let denom of allowedDenominations) {
        let diff = Math.abs(value - denom);
        if (diff < minDiff) {
          minDiff = diff;
          closest = denom;
        }
      }
      return closest;
    } else {
      // For values above 1, round to nearest whole number
      return Math.round(value);
    }
  }

  const optimalBigBlind = totalInPlay > 0 ? roundToAllowedDenomination(totalInPlay / 100) : 0;

  return (
    <>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          padding: 'var(--mantine-spacing-md)',
          backgroundColor: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-gray-2)',
        }}
      >
        <Title order={3} fw={700}>
          Poker Buy-In Tracker
        </Title>
        <ThemeToggle />
      </Box>

      <Container size="md" py="lg">
        {players.length > 0 && (
          <Card withBorder radius="md" shadow="sm" p="sm" mb="lg" style={{ overflowX: 'auto' }}>
            <Flex direction="column" gap="xs">
              <Text fw={600} size="sm">
                Totals Overview
              </Text>
              <Table
  stickyHeader
  style={{ fontSize: 'var(--mantine-font-size-sm)' }}
  verticalSpacing="xs"
  highlightOnHover={false}
  withTableBorder
  layout="fixed"
>
  <thead>
    <tr>
      <th className='text-center'>Total in Play</th>
      {Object.keys(totalsByMethod).map((method) => (
        <th className='text-center' key={method}>{method}</th>
      ))}
      <th className='text-center'>Optimal BB (Total)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className='text-center'>${totalInPlay.toFixed(2)}</td>
      {Object.keys(totalsByMethod).map((method) => (
        <td className='text-center' key={method}>${totalsByMethod[method].toFixed(2)}</td>
      ))}
      <td className='text-center'>
        {optimalBigBlind % 1 === 0
          ? optimalBigBlind
          : optimalBigBlind.toFixed(2)}
      </td>
    </tr>
  </tbody>
</Table>

              {/* List players in vertical list with their totals */}
              <Box mt="md">
                {players.map((player, idx) => {
                  const total = player.buyIns.reduce((acc, curr) => acc + curr.amount, 0);
                  return (
                    <Text key={idx} size="sm" mb="xs">
                      {player.name}: ${total.toFixed(2)}
                    </Text>
                  );
                })}
              </Box>
            </Flex>
          </Card>
        )}

        <Card shadow="md" radius="md" p="lg" mb="lg" withBorder>
          <Title order={4} mb="sm">
            Add Players
          </Title>
          <Group grow mb="md" className="flex-col" gap="xs">
            <TextInput
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.currentTarget.value)}
            />
            <Button leftSection={<IconPlus size={18} />} variant="filled" onClick={addPlayer} color="teal">
              Add Player
            </Button>
          </Group>
          <Group gap="xs">
            {players.map((player, idx) => (
              <Badge key={idx} variant="filled" color="teal">
                {player.name}
              </Badge>
            ))}
          </Group>
        </Card>

        <Card shadow="md" radius="md" p="lg" mb="lg" withBorder>
          <Title order={4} mb="sm">
            Set Initial Buy-In (All Players)
          </Title>
          <Group align="flex-end" gap="xs">
            <NumberInput
              value={initialBuyIn}
              onChange={(value: string | number) => {
                const numericValue = typeof value === 'number' ? value : Number(value) || 0;
                setInitialBuyIn(numericValue);
              }}
              placeholder="Initial buy-in amount"
              min={0}
              disabled={globalBuyInSet}
              allowNegative={false}
            />
            <Button
              variant="filled"
              onClick={applyGlobalBuyIn}
              color="green"
              disabled={globalBuyInSet || players.length === 0 || initialBuyIn <= 0}
            >
              {globalBuyInSet ? 'Applied' : 'Apply'}
            </Button>
          </Group>
          {globalBuyInSet && (
            <Text size="sm" c="green" mt="xs">
              Initial buy-in applied to all players (defaulted to Cash).
            </Text>
          )}
        </Card>

        <Card shadow="md" radius="md" p="lg" mb="lg" withBorder>
          <Title order={4} mb="sm">
            Shareable Link
          </Title>
          <Text size="sm" color="dimmed" mb="sm">
            Generate a link so friends can view totals (read-only).
          </Text>
          <Button
            variant="filled"
            color="violet"
            leftSection={<IconLink size={18} />}
            onClick={handleGenerateShareLink}
          >
            Generate Share Link
          </Button>
        </Card>

        <Card shadow="md" radius="md" p="lg" withBorder>
          <Title order={4} mb="sm">
            Buy-In Tracker
          </Title>
          {players.length === 0 ? (
            <Text color="dimmed">No players added yet.</Text>
          ) : (
            <Box mt="md">
              {players.map((player, pIndex) => {
                const total = player.buyIns.reduce((acc, curr) => acc + curr.amount, 0);
                return (
                  <Card key={pIndex} withBorder shadow="sm" radius="md" p="md" mb="md">
                    <Group justify="apart" mb="xs" align="flex-start">
                      <div>
                        <Text fw={600}>{player.name}</Text>
                        <Text size="xs" c="dimmed">
                          Total: ${total.toFixed(2)}
                        </Text>
                      </div>
                      {globalBuyInSet && (
                        <Button
                          size="xs"
                          variant="light"
                          color="teal"
                          onClick={() => setQuickAddPlayerIndex(pIndex)}
                        >
                          Quick Add (+{initialBuyIn})
                        </Button>
                      )}
                    </Group>
                    {quickAddPlayerIndex === pIndex && (
                      <Flex gap="xs" mb="md" wrap="wrap">
                        <Select
                          data={[...paymentMethods]}
                          value={quickAddMethod}
                          onChange={(val) => setQuickAddMethod(val!)}
                          placeholder="Payment Method"
                        />
                        {quickAddMethod === 'Custom' && (
                          <TextInput
                            placeholder="Custom method"
                            value={quickAddCustomMethod}
                            onChange={(e) => setQuickAddCustomMethod(e.currentTarget.value)}
                          />
                        )}
                        <Button color="teal" onClick={() => handleQuickAdd(pIndex)}>
                          Add
                        </Button>
                        <Button variant="subtle" onClick={() => setQuickAddPlayerIndex(null)}>
                          Cancel
                        </Button>
                      </Flex>
                    )}

                    {player.buyIns.length === 0 ? (
                      <Text size="sm" color="dimmed">
                        No buy-ins yet.
                      </Text>
                    ) : (
                      <Box mt="sm">
                        {player.buyIns.map((bi, i) => (
                          <Flex
                            key={i}
                            align="center"
                            justify="space-between"
                            py="xs"
                            style={{
                              borderBottom:
                                i < player.buyIns.length - 1
                                  ? '1px solid var(--mantine-color-gray-4)'
                                  : 'none',
                            }}
                          >
                            <Text size="sm">
                              {bi.method !== 'Initial' && '$'}
                              {bi.amount} - {bi.method}
                              {bi.method === 'Initial' && (
                                <Text component="span" fs="italic" size="xs" c="dimmed" ml="xs">
                                  (Initial)
                                </Text>
                              )}
                            </Text>
                            <Group gap="xs">
                              <ActionIcon color="blue" onClick={() => startEditBuyIn(pIndex, i)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon color="red" onClick={() => deleteBuyInOfPlayer(pIndex, i)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Flex>
                        ))}
                      </Box>
                    )}

                    <AddBuyInForm onAdd={(amount, method) => addBuyInToPlayer(pIndex, amount, method)} />
                  </Card>
                );
              })}
            </Box>
          )}
        </Card>
      </Container>

      <Modal opened={!!editingBuyIn} onClose={() => setEditingBuyIn(null)} title="Edit Buy-In">
        {editingBuyIn && (
          <EditBuyInForm
            paymentMethods={paymentMethods}
            amount={editingBuyIn.amount}
            method={editingBuyIn.method}
            customMethod={editingBuyIn.customMethod}
            onChange={(field, value) => setEditingBuyIn((prev) => prev && { ...prev, [field]: value })}
            onSave={saveEditBuyIn}
            onCancel={() => setEditingBuyIn(null)}
          />
        )}
      </Modal>

      <Modal opened={showShareModal} onClose={() => setShowShareModal(false)} title="Share Link">
        {shareLink ? (
          <>
            <Text size="sm" mb="sm">
              Share this link with your friends (view-only):
            </Text>
            <Text size="sm" color="blue" style={{ wordBreak: 'break-all' }}>
              {shareLink}
            </Text>
          </>
        ) : (
          <Text size="sm">Generating link...</Text>
        )}
      </Modal>
    </>
  );
}

function AddBuyInForm({ onAdd }: { onAdd: (amount: number, method: string) => void }) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>(paymentMethods[0]);
  const [customMethod, setCustomMethod] = useState<string>('');

  const handleAdd = () => {
    const finalMethod = method === 'Custom' && customMethod.trim() !== '' ? customMethod : method;
    if (amount > 0) {
      onAdd(amount, finalMethod);
      setAmount(0);
      setCustomMethod('');
      setMethod(paymentMethods[0]);
    }
  };

  return (
    <Box mt="md">
      <Grid gutter={{ base: 'xs' }}>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Amount"
            value={amount}
            onChange={(value: string | number) => {
              const numericValue = typeof value === 'number' ? value : Number(value) || 0;
              setAmount(numericValue);
            }}
            min={0}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Select
            label="Method"
            data={paymentMethods}
            value={method}
            onChange={(val) => setMethod(val || '')}
          />
        </Grid.Col>
        {method === 'Custom' && (
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Custom Method"
              placeholder="e.g. Bank Transfer"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.currentTarget.value)}
            />
          </Grid.Col>
        )}
      </Grid>
      <Button mt="md" onClick={handleAdd} color="blue" leftSection={<IconPlus size={16} />}>
        Add Buy-In
      </Button>
    </Box>
  );
}

function EditBuyInForm({
  paymentMethods,
  amount,
  method,
  customMethod,
  onChange,
  onSave,
  onCancel,
}: {
  paymentMethods: string[];
  amount: number;
  method: string;
  customMethod: string;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <NumberInput
        label="Amount"
        value={amount}
        onChange={(val) => onChange('amount', val || 0)}
        min={0}
        mb="sm"
      />
      <Select
        label="Method"
        data={paymentMethods}
        value={method}
        onChange={(val) => onChange('method', val!)}
        mb="sm"
      />
      {method === 'Custom' && (
        <TextInput
          label="Custom Method"
          value={customMethod}
          onChange={(e) => onChange('customMethod', e.currentTarget.value)}
          mb="sm"
        />
      )}
      <Group justify="right">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="green" onClick={onSave}>
          Save
        </Button>
      </Group>
    </>
  );
}

function DarkModeToggle() {
  if (typeof window === 'undefined') return null; // Just for SSR safety

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setColorScheme(saved);
    }
  }, []);

  const toggle = () => {
    const next = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(next);
    localStorage.setItem('theme', next);
    const event = new Event('toggle-color-scheme');
    document.dispatchEvent(event);
  };

  return (
    <Tooltip label="Toggle theme" withArrow position="bottom">
      <ActionIcon variant="outline" color={colorScheme === 'light' ? 'dark' : 'yellow'} onClick={toggle}>
        {colorScheme === 'light' ? <IconSun size="1.1rem" /> : <IconMoonStars size="1.1rem" />}
      </ActionIcon>
    </Tooltip>
  );
}
