'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { ArrowLeft, CheckCircle2, Keyboard, QrCode, ScanLine, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { checkInEnrollment } from '../../lib/events'
import { CheckInResult } from '../../lib/types'

interface ScanFeedback {
  status: 'success' | 'warning' | 'error'
  message: string
  participant?: CheckInResult['participant']
}

interface QrCheckInScannerProps {
  eventId: string
  onCheckInSuccess?: () => void
  /** Oculta o botão de voltar ao dashboard (ex.: modal embutido no dashboard) */
  embedded?: boolean
  /** Centraliza o preview da câmera e os controles na página de check-in */
  centered?: boolean
}

function isSecureCameraContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext || window.location.hostname === 'localhost'
}

async function resolveCameraId(): Promise<string | { facingMode: 'user' | 'environment' }> {
  try {
    const cameras = await Html5Qrcode.getCameras()
    if (cameras.length === 0) {
      return { facingMode: 'user' }
    }

    const backCamera = cameras.find((camera) =>
      /back|rear|environment|traseira|trás/i.test(camera.label),
    )
    if (backCamera) return backCamera.id

    const frontCamera = cameras.find((camera) =>
      /front|user|face|frontal/i.test(camera.label),
    )
    if (frontCamera) return frontCamera.id

    return cameras[0].id
  } catch {
    return { facingMode: 'user' }
  }
}

function formatCameraError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (!isSecureCameraContext()) {
    return 'A câmera só funciona em HTTPS ou localhost. Acesse o site por uma conexão segura.'
  }
  if (message.includes('notallowed') || message.includes('permission')) {
    return 'Permissão de câmera negada. Autorize o acesso nas configurações do navegador e tente novamente.'
  }
  if (message.includes('notfound') || message.includes('no camera')) {
    return 'Nenhuma câmera encontrada neste dispositivo. Use a opção de colar o código manualmente.'
  }
  if (message.includes('notreadable') || message.includes('in use')) {
    return 'A câmera está em uso por outro aplicativo. Feche outros apps e tente novamente.'
  }

  return 'Não foi possível abrir a câmera. Tente novamente ou cole o código manualmente.'
}

export default function QrCheckInScanner({
  eventId,
  onCheckInSuccess,
  embedded = false,
  centered = false,
}: QrCheckInScannerProps) {
  const router = useRouter()
  const reactId = useId().replace(/:/g, '')
  const scannerElementId = `qr-check-in-scanner-${reactId}`

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner) {
      try {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          await scanner.stop()
        }
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

  async function submitToken(token: string) {
    const trimmed = token.trim()
    if (!trimmed || processingRef.current) return

    processingRef.current = true
    setCameraError(null)

    await stopScanner()

    try {
      const result = await checkInEnrollment(eventId, trimmed)
      setFeedback({
        status: result.alreadyCheckedIn ? 'warning' : 'success',
        message:
          result.message ||
          (result.alreadyCheckedIn
            ? 'Check-in já havia sido registrado.'
            : 'Check-in realizado com sucesso!'),
        participant: result.participant,
      })
      setManualToken('')
      setShowManualInput(false)
      if (!result.alreadyCheckedIn) {
        onCheckInSuccess?.()
      }
    } catch (err: unknown) {
      setFeedback({
        status: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível validar o QR code',
      })
    } finally {
      processingRef.current = false
    }
  }

  async function handleDecoded(decodedText: string) {
    if (processingRef.current) return
    await submitToken(decodedText)
  }

  async function startScanner() {
    setFeedback(null)
    setCameraError(null)
    setShowManualInput(false)
    setStarting(true)

    // O container PRECISA estar visível antes do html5-qrcode iniciar.
    setScanning(true)

    try {
      if (!isSecureCameraContext()) {
        throw new Error('insecure-context')
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const scanner = new Html5Qrcode(scannerElementId, /* verbose= */ false)
      scannerRef.current = scanner

      const camera = await resolveCameraId()
      const viewportWidth = Math.min(window.innerWidth - 48, 320)

      await scanner.start(
        camera,
        {
          fps: 10,
          qrbox: { width: viewportWidth * 0.75, height: viewportWidth * 0.75 },
          aspectRatio: 1,
        },
        (decodedText) => void handleDecoded(decodedText),
        () => {
          // frames sem QR code são esperados
        },
      )
    } catch (error) {
      scannerRef.current = null
      setScanning(false)
      setCameraError(formatCameraError(error))
      setShowManualInput(true)
    } finally {
      setStarting(false)
    }
  }

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault()
    setManualLoading(true)
    try {
      await submitToken(manualToken)
    } finally {
      setManualLoading(false)
    }
  }

  const scannerContent = (
    <div className={centered ? 'mx-auto w-full max-w-sm space-y-4 sm:max-w-md' : 'space-y-4'}>
      {/* Container sempre no DOM; visibilidade controlada por CSS, nunca display:none durante start */}
      <div
        className={`mx-auto overflow-hidden rounded-lg bg-black ${
          scanning
            ? 'block aspect-square w-full max-w-[min(100%,320px)] min-h-[240px] sm:min-h-[280px] sm:max-w-[360px]'
            : 'hidden'
        }`}
      >
        <div
          id={scannerElementId}
          className="flex size-full items-center justify-center [&_video]:!mx-auto [&_video]:!h-full [&_video]:!max-h-full [&_video]:!w-full [&_video]:!object-cover"
        />
      </div>

      {!scanning && !feedback && (
        <p className={`text-sm text-muted-foreground ${centered ? 'text-center sm:text-left' : ''}`}>
          Toque em &quot;Iniciar leitura&quot; e aponte a câmera para o QR code enviado por e-mail
          ao participante. Em notebook, use a webcam frontal.
        </p>
      )}

      {starting && (
        <p className="text-sm text-muted-foreground" role="status">
          Solicitando acesso à câmera…
        </p>
      )}

      {cameraError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {cameraError}
        </p>
      )}

      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-md p-3 text-sm ${
            feedback.status === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : feedback.status === 'warning'
                ? 'bg-amber-50 text-amber-900'
                : 'bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.status === 'error' ? (
            <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
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
        <Button variant="outline" className="h-11 w-full" onClick={() => void stopScanner()}>
          Parar leitura
        </Button>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {!embedded && feedback && (
            <Button
              variant="outline"
              className="h-11 w-full sm:flex-1"
              onClick={() => router.push(`/admin/dashboard?eventId=${eventId}`)}
            >
              <ArrowLeft aria-hidden="true" />
              Voltar ao dashboard do evento
            </Button>
          )}
          <Button
            className={`h-11 w-full ${!embedded && feedback ? 'sm:flex-1' : ''}`}
            onClick={() => void startScanner()}
            disabled={starting}
          >
            <ScanLine aria-hidden="true" />
            {starting ? 'Abrindo câmera...' : feedback ? 'Ler próximo QR code' : 'Iniciar leitura'}
          </Button>
        </div>
      )}

      {!scanning && (
        <div className="space-y-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={() => setShowManualInput((value) => !value)}
          >
            <Keyboard aria-hidden="true" />
            {showManualInput ? 'Ocultar código manual' : 'Colar código manualmente'}
          </Button>

          {showManualInput && (
            <form className="space-y-3" onSubmit={handleManualSubmit}>
              <Input
                label="Código do QR Code"
                name="manualToken"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Cole aqui o conteúdo lido do QR code"
              />
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={manualLoading || !manualToken.trim()}
              >
                {manualLoading ? 'Validando...' : 'Validar código'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )

  if (embedded) {
    return scannerContent
  }

  return (
    <Card className={centered ? 'mx-auto w-full' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4 text-primary" aria-hidden="true" />
          Check-in por QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>{scannerContent}</CardContent>
    </Card>
  )
}
