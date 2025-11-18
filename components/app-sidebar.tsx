'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { SidebarHistory } from '@/components/sidebar-history';
import { Button } from '@/components/ui/button';
import { Home, Compass, Layers, TrendingUp, Plus, LogIn, ChevronLeft, ChevronRight, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebarContext } from '@/components/sidebar-context';

const navigationItems = [
  { id: 'home', icon: Home, label: 'Início', path: '/' },
  { id: 'discover', icon: Compass, label: 'Descobrir', path: '/discover' },
  { id: 'spaces', icon: Layers, label: 'Espaços', path: '/spaces' },
  { id: 'finance', icon: TrendingUp, label: 'Finanças', path: '/finance' },
];

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, setIsCollapsed, activePanel, setActivePanel } = useSidebarContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevenir scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (!isCollapsed && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isCollapsed]);

  const handleNavClick = (itemId: string, path: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setActivePanel(activePanel === itemId ? null : itemId);
    if (path) router.push(path);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      // Ao colapsar, fecha o painel
      setActivePanel(null);
    } else {
      // Ao expandir, abre o painel "Início"
      setActivePanel('home');
    }
  };

  return (
    <>
      {/* Mobile Header - Visível apenas em mobile */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-[#0A0A0A] dark:bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between px-4 z-50">
        {/* Botão Menu/Histórico */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="size-10 text-white hover:bg-white/10 rounded-full"
        >
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        {/* Espaço central vazio */}
        <div className="flex-1" />

        {/* Botões direita */}
        <div className="flex items-center gap-2">
          {/* Botão Nova Conversa */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              router.push('/');
              router.refresh();
            }}
            className="size-10 text-white hover:bg-white/10 rounded-full"
          >
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>

          {/* Botão Menu (3 pontos) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 text-white hover:bg-white/10 rounded-full"
              >
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {!mounted ? (
                  <Moon className="size-4 mr-2" />
                ) : theme === 'dark' ? (
                  <Sun className="size-4 mr-2" />
                ) : (
                  <Moon className="size-4 mr-2" />
                )}
                {!mounted ? 'Alternar Tema' : theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 dark:text-red-400"
                  onSelect={() => signOut({ redirectTo: '/' })}
                >
                  <LogOut className="size-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => router.push('/login')}
                >
                  <LogIn className="size-4 mr-2" />
                  Entrar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Sidebar - Menu lateral deslizante */}
      <AnimatePresence>
        {!isCollapsed && (
          <>
            {/* Overlay escuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40 overflow-hidden"
              onClick={toggleCollapse}
            />

            {/* Menu lateral */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden fixed left-0 top-16 bottom-0 w-80 bg-[#0A0A0A] z-50 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4">
                {/* Campo de busca */}
                <div className="mb-6">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#8F5BFF]"
                    />
                  </div>
                </div>

                {/* Histórico de conversas */}
                <SidebarHistory user={user} searchQuery={searchQuery} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Oculta em mobile */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen z-50">
        {/* Coluna Principal - Estreita */}
        <motion.div 
          animate={{ width: isCollapsed ? 0 : 80 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0A0A0A] dark:bg-[#0A0A0A] flex flex-col items-center py-6 gap-8 border-r border-zinc-200 dark:border-white/5 overflow-hidden"
        >
        {/* Logo */}
        <Image
            src="/images/logo-adalink.svg"
            alt="Logo"
            width={20}
            height={20}
            className="object-contain"
          />

        {/* Botão + */}
        <Button
          onClick={() => {
            router.push('/');
            router.refresh();

          }}
          className="size-10 rounded-full bg-[#8F5BFF] hover:bg-[#A970FF] text-white p-0 transition-all duration-200 hover:shadow-lg hover:shadow-[#8F5BFF]/30"
        >
          <Plus className="size-6" />
        </Button>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col gap-4 w-full px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePanel === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`
                  flex flex-col items-center gap-1 py-3 px-2 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#8F5BFF]/20 text-[#8F5BFF]' 
                    : 'text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-[#8F5BFF]'
                  }
                `}
              >
                <Icon className="size-5" strokeWidth={1.5} />
                {isActive && !isCollapsed && (
                  <span className="text-[10px] font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botão de Tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="size-10 text-zinc-600 dark:text-white/70 hover:text-[#8F5BFF] hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          {!mounted ? <Moon className="size-5" /> : theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        {/* Botão Entrar */}
        {!user && (
          <Button
            className="size-12 rounded-full bg-[#8F5BFF] hover:bg-[#A970FF] text-white p-0 transition-all duration-200"
            onClick={() => router.push('/login')}
          >
            <LogIn className="size-5" />
          </Button>
        )}

        {/* Avatar do usuário com Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="size-10 rounded-full bg-[#8F5BFF] flex items-center justify-center text-white font-medium text-sm hover:bg-[#A970FF] transition-colors">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {!mounted ? (
                  <Moon className="size-4 mr-2" />
                ) : theme === 'dark' ? (
                  <Sun className="size-4 mr-2" />
                ) : (
                  <Moon className="size-4 mr-2" />
                )}
                {!mounted ? 'Alternar Tema' : theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 dark:text-red-400"
                onSelect={() => signOut({ redirectTo: '/' })}
              >
                <LogOut className="size-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>

      {/* Painel Expansível */}
      <AnimatePresence>
        {activePanel && !isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white dark:bg-[#111315] border-r border-zinc-200 dark:border-white/5 overflow-hidden"
          >
            <div className="h-full flex flex-col p-6">
              {/* Header do Painel */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-zinc-900 dark:text-white">
                  {navigationItems.find(item => item.id === activePanel)?.label}
                </h2>
              </div>

              {/* Conteúdo do Painel */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activePanel === 'home' && (
                  <SidebarHistory user={user} searchQuery={searchQuery} />
                )}
                
                {activePanel === 'discover' && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">Explorar tópicos</p>
                    {['Tecnologia', 'Ciência', 'Arte', 'Negócios'].map((topic) => (
                      <button
                        key={topic}
                        className="w-full text-left px-3 py-2 rounded-lg text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-[#8F5BFF] transition-colors"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}

                {activePanel === 'spaces' && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">Seus espaços</p>
                    {['Projetos', 'Pessoal', 'Trabalho'].map((space) => (
                      <button
                        key={space}
                        className="w-full text-left px-3 py-2 rounded-lg text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-[#8F5BFF] transition-colors"
                      >
                        {space}
                      </button>
                    ))}
                  </div>
                )}

                {activePanel === 'finance' && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">Mercados</p>
                    {['🇺🇸 Mercados dos EUA', '₿ Criptomoeda', '📊 Ganhos', '🔍 Análise'].map((item) => (
                      <button
                        key={item}
                        className="w-full text-left px-3 py-2 rounded-lg text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-[#8F5BFF] transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Botão de Toggle (Expandir/Recolher) - Desktop */}
        <button
          onClick={toggleCollapse}
          className={`
            hidden md:flex fixed top-4 transition-all duration-300 z-50
            size-8 rounded-full
            bg-white dark:bg-[#111315]
            border-2 items-center justify-center
            shadow-lg hover:shadow-xl
            ${isCollapsed 
              ? 'left-2 border-zinc-300 dark:border-white/20 text-zinc-600 dark:text-white/70 hover:border-[#8F5BFF] hover:text-[#8F5BFF]' 
              : 'left-[340px] border-[#8F5BFF] text-[#8F5BFF] hover:bg-[#8F5BFF]/10'
            }
          `}
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
    </>
  );
}
