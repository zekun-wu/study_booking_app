import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Globe } from "lucide-react";
import { useLocation } from "wouter";

export default function StudyDescription() {
  const { language, setLanguage, t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('studyTitle')}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              English
            </Button>
            <Button
              variant={language === 'de' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('de')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Deutsch
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('studyPurpose')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {t('studyPurposeText')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">
                {language === 'en' ? '📍 Study Locations' : '📍 Studienorte'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-blue-900 mb-3">
                {language === 'en' ? (
                  <span>This study is conducted at <strong>TWO</strong> locations. You will choose your preferred location when booking:</span>
                ) : (
                  <span>Diese Studie wird an <strong>ZWEI</strong> Standorten durchgeführt. Sie wählen Ihren bevorzugten Standort bei der Buchung:</span>
                )}
              </p>
              <ul className="space-y-2 text-gray-800">
                <li className="flex items-center gap-2">
                  <span className="text-2xl">🏛️</span>
                  <span className="font-semibold">Saarland</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  <span className="font-semibold">IWM (Leibniz-Institut für Wissensmedien)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-900">
                {language === 'en' ? '⚠️ Important: Study Language' : '⚠️ Wichtig: Studiensprache'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-amber-900">
                {language === 'en' ? (
                  <span>This study is conducted <strong className="underline">entirely in GERMAN</strong>. All instructions, materials, and interactions will be in German. Please ensure you and your child are comfortable participating in German before booking.</span>
                ) : (
                  <span>Diese Studie wird <strong className="underline">vollständig auf DEUTSCH</strong> durchgeführt. Alle Anweisungen, Materialien und Interaktionen erfolgen auf Deutsch. Bitte stellen Sie sicher, dass Sie und Ihr Kind sich wohl fühlen, auf Deutsch teilzunehmen, bevor Sie buchen.</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('whatWillHappen')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{t('whatWillHappenText')}</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span>{t('whatItem1')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span>{t('whatItem2')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span>{t('whatItem3')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <span>{t('whatItem4')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    5
                  </span>
                  <span>{t('whatItem5')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-6">
            <Button
              size="lg"
              className="px-8"
              onClick={() => setLocation("/book")}
            >
              {t('continueToBooking')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
