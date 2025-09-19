'use client'

import { useUserDataContext } from "@/lib/contexts/UserDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { userData, loading, error } = useUserDataContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">Erro: {error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">Usuário não autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao Modules Base
            </h1>
            <p className="text-gray-600">
              Sistema de autenticação com Supabase implementado com sucesso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                Informações do Usuário
              </h2>
              <div className="space-y-2">
                <p><span className="font-medium">Nome:</span> {userData.userName}</p>
                <p><span className="font-medium">Email:</span> {userData.email}</p>
                <p><span className="font-medium">Role:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    userData.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {userData.role}
                  </span>
                </p>
                <p><span className="font-medium">Tipo:</span> {userData.type}</p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-4">
                Informações da Empresa
              </h2>
              <div className="space-y-2">
                <p><span className="font-medium">User ID:</span> {userData.userId}</p>
                <p><span className="font-medium">Company ID:</span> {userData.companyId}</p>
                <p><span className="font-medium">Location ID:</span> {userData.activeLocation}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sistema de Autenticação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Supabase configurado</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Sessão ativa</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Cache funcionando</span>
              </div>
            </div>
          </div>

          {userData.role === 'admin' && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <span>Formulário de Proposta</span>
                  </CardTitle>
                  <CardDescription>
                    Acesse o formulário multistep para criar novas propostas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/proposal-form">
                    <Button className="flex items-center space-x-2">
                      <span>Acessar Formulário</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
