import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../tui/utils/messageRenderer.js', () => ({
  renderMessage: vi.fn(async () => undefined),
}));

import { handleChannelSelect, handleVoiceChannelSelect } from '../tui/handlers/channelHandler.js';
import { renderMessage } from '../tui/utils/messageRenderer.js';

describe('channelHandler', () => {
  let ui: any;

  beforeEach(() => {
    ui = {
      showChatUI: vi.fn(),
      setChatLabel: vi.fn(),
      setInputLabel: vi.fn(),
      setTitleBar: vi.fn(),
      appendChat: vi.fn(),
      clearChat: vi.fn(),
      setChatContent: vi.fn(),
      setStatusBar: vi.fn(),
      clearInput: vi.fn(),
      hardRefresh: vi.fn(),
      render: vi.fn(),
    };
    (renderMessage as any).mockClear();
  });

  it('loads channel and renders messages successfully', async () => {
    const channel = {
      name: 'general',
      guild: { name: 'My Server' },
      messages: {
        fetch: vi.fn(async () => new Map([['1', { author: { id: '1' }, createdTimestamp: 1672531200000, content: 'Hi', mentions: { users: new Map() }, attachments: new Map() }]])),
      },
    } as any;

    await handleChannelSelect(channel, ui, { id: 'bot' } as any);

    expect(ui.setTitleBar).toHaveBeenCalledWith('My Server', 'general', 'connected');
    expect(ui.setStatusBar).toHaveBeenCalledWith(expect.stringContaining('Connected to #general'));
    expect(ui.clearChat).toHaveBeenCalled();
    expect(ui.render).toHaveBeenCalled();
    expect(renderMessage).toHaveBeenCalled();
  });

  it('handles channel load failure by displaying disconnected status', async () => {
    const channel = {
      name: 'general',
      guild: { name: 'My Server' },
      messages: {
        fetch: vi.fn(async () => { throw new Error('fail'); }),
      },
    } as any;

    await handleChannelSelect(channel, ui, null);

    expect(ui.setTitleBar).toHaveBeenCalledWith('My Server', 'general', 'disconnected');
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('Failed to load messages'));
    expect(ui.render).toHaveBeenCalled();
  });

  it('renders voice channel member list when a voice channel is selected', () => {
    const channel = {
      name: 'voice-room',
      guild: { name: 'My Server' },
      members: {
        values: () => [
          {
            id: 'bot',
            displayName: 'Bot User',
            user: { username: 'BotUser' },
            voice: {
              selfMute: false,
              serverMute: false,
              selfDeaf: false,
              serverDeaf: false,
              streaming: false,
              selfVideo: false,
            },
          },
          {
            id: 'u1',
            displayName: 'Alice',
            user: { username: 'Alice' },
            voice: {
              selfMute: true,
              serverMute: false,
              selfDeaf: false,
              serverDeaf: false,
              streaming: true,
              selfVideo: false,
            },
          },
        ],
      },
    } as any;

    handleVoiceChannelSelect(channel, ui, { id: 'bot' } as any);

    expect(ui.setTitleBar).toHaveBeenCalledWith('My Server', 'voice-room', 'connected');
    expect(ui.setStatusBar).toHaveBeenCalledWith(expect.stringContaining('Connected to voice #voice-room'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('Voice Members (2)'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('Bot User'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('(bot)'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('you'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('(u1)'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('muted'));
    expect(ui.appendChat).toHaveBeenCalledWith(expect.stringContaining('streaming'));
    expect(ui.render).toHaveBeenCalled();
  });
});