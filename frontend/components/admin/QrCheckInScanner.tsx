'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, QrCode, ScanLine, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { checkInEnrollment } from '../../lib/events'
import { CheckInResult } from '../../lib/types'

const SCANNER_ELEMENT_ID = 'qr-check-in-scanner'

interface ScanFeedback {
  status: 'success' | 'error'
  message: string
  participant?: CheckInResult['participant']
}

interface QrCheckInScannerProps {
  eventId: string
  /** Chamado após um check-in bem-sucedido para a página atualizar a lista de inscritos. */
  onCheckInSuccess?: () => void
}

export default function QrCheckInScanner({ eventId, onCheckInSuccess }: QrCheckInScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner) {
      try {
        await scanner.stop()
        scanner.clear()
      } catch {
        // scanner já estava parado
      }
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      void stopScanner()
    }
  }, [stopScanner])

  async function handleDecoded(decodedText: string) {
    if (processingRef.current) return
    processingRef.current = true

    await stopScanner()

    try {
      const result = await checkInEnrollment(eventId, decodedText)
      setFeedback({
        status: 'success',
        message: 'Check-in realizado com sucesso!',
        participant: result.participant,
      })
      onCheckInSuccess?.()
    } catch (err: any) {
      setFeedback({
        status: 'error',
        message: err.message || 'Não foi possível validar o QR code',
      })
    } finally {
      processingRef.current = false
    }
  }

  async function startScanner() {
    setFeedback(null)
    setCameraError(null)
    setStarting(true)

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => void handleDecoded(decodedText),
        () => {
          // frames sem QR code são esperados; nada a fazer
        },
      )
      setScanning(true)
    } catch {
      scannerRef.current = null
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4 text-primary" aria-hidden="true" />
          Check-in por QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id={SCANNER_ELEMENT_ID}
          className={`overflow-hidden rounded-md bg-muted ${scanning ? '' : 'hidden'}`}
        />

        {!scanning && !feedback && (
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para o QR code recebido por e-mail pelo participante para validar a inscrição.
          </p>
        )}

        {cameraError && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{cameraError}</p>
        )}

        {feedback && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-md p-3 text-sm ${
              feedback.status === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {feedback.status === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-medium">{feedback.message}</p>
              {feedback.participant && (
                <p className="mt-1">
                  {feedback.participant.name}
                  <span className="block text-xs opacity-80">{feedback.participant.email}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {scanning ? (
          <Button variant="outline" className="w-full" onClick={() => void stopScanner()}>
            Parar leitura
          </Button>
        ) : (
          <Button className="w-full" onClick={() => void startScanner()} disabled={starting}>
            <ScanLine aria-hidden="true" />
            {starting ? 'Abrindo câmera...' : feedback ? 'Ler próximo QR code' : 'Iniciar leitura'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
