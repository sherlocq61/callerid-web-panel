import Groq from "groq-sdk"

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
    dangerouslyAllowBrowser: true
})

export interface ConversationTurn {
    speaker: 'ai' | 'caller'
    text: string
    timestamp: string
}

export interface AIResponse {
    text: string
    callerName: string | null
    reason: string | null
    isUrgent: boolean
    hasImportantInfo: boolean
    shouldEndCall: boolean
}

export async function getAIResponse(
    userInput: string,
    context: ConversationTurn[] = []
): Promise<AIResponse> {
    try {
        const contextMessages = context.map(turn => ({
            role: turn.speaker === 'ai' ? 'assistant' : 'user',
            content: turn.text
        }))

        const response = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Sen bir telefon asistanısın. Kullanıcı şu an meşgul, sen onun yerine konuşuyorsun.

GÖREV:
1. Arayan kişinin adını öğren
2. Arama nedenini öğren
3. Acil olup olmadığını anla
4. Nazik ve profesyonel ol
5. Kısa ve öz yanıtlar ver (max 2 cümle)

KURALLAR:
- Türkçe konuş
- Samimi ama profesyonel ol
- Gereksiz detaya girme
- Bilgi topladıktan sonra konuşmayı bitir

YANIT FORMATI (JSON):
{
  "text": "söyleyeceğin cümle",
  "callerName": "isim veya null",
  "reason": "arama nedeni veya null", 
  "isUrgent": true/false,
  "hasImportantInfo": true/false,
  "shouldEndCall": true/false
}

ÖNEMLİ: Sadece JSON yanıt ver, başka hiçbir şey ekleme!`
                },
                ...contextMessages,
                {
                    role: "user",
                    content: userInput
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 200
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error("No response from AI")
        }

        const parsed = JSON.parse(content) as AIResponse
        return parsed

    } catch (error) {
        console.error("Groq API error:", error)

        // Fallback response
        return {
            text: "Özür dilerim, sizi duyamadım. Tekrar söyleyebilir misiniz?",
            callerName: null,
            reason: null,
            isUrgent: false,
            hasImportantInfo: false,
            shouldEndCall: false
        }
    }
}

export async function generateGreeting(userName: string): Promise<string> {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "Sen bir telefon asistanısın. Kısa ve profesyonel selamlama cümleleri üret."
                },
                {
                    role: "user",
                    content: `${userName} adlı kullanıcı için telefon selamlama cümlesi üret. Kısa ve öz olsun.`
                }
            ],
            temperature: 0.8,
            max_tokens: 50
        })

        return response.choices[0]?.message?.content ||
            `Merhaba, ${userName} şu an meşgul. Kim arıyor?`

    } catch (error) {
        console.error("Groq greeting error:", error)
        return `Merhaba, ${userName} şu an meşgul. Kim arıyor?`
    }
}
