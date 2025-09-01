'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { ChevronLeftIcon, MenuIcon } from './icons';
import Image from 'next/image';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useState } from 'react';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Sidebar
      className="group-data-[side=left]:border-r border-r-gray-300 bg-sidebar-custom rounded-tr-xl rounded-br-xl shadow-lg"
      collapsible="icon"
    >
      <SidebarHeader>
        <SidebarMenu>
          {/* Ícone Menu quando colapsado */}
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-4 hidden">
            <Button
              variant="ghost"
              size="sm"
              className="size-8 hover:bg-gray-100"
              onClick={() => toggleSidebar()}
              title="Expandir menu"
            >
              <MenuIcon size={16} />
            </Button>
          </div>

          {/* Conteúdo expandido */}
          <div className="flex flex-col gap-4 group-data-[collapsible=icon]:hidden">
            <div className="flex flex-row justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="size-8"
                onClick={() => toggleSidebar()}
              >
                <ChevronLeftIcon size={16} />
              </Button>
            </div>
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex justify-center items-center mt-3"
            >
              <Image
                src="/images/logo-light.svg"
                alt="AdaFlow Logo"
                width={130}
                height={40}
                className="object-contain"
              />
            </Link>
            <Input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:border-gray-300 focus:ring-0"
            />
            <Button
              type="button"
              className="px-4 py-2 text-white text-sm font-medium rounded-md transition-colors duration-200 w-full bg-purple-custom-500 hover:bg-purple-custom-600"
              onClick={() => {
                setOpenMobile(false);
                router.push('/');
                router.refresh();
              }}
            >
              Nova conversa
            </Button>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2 custom-scrollbar">
        <SidebarHistory user={user} searchQuery={searchQuery} />
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
