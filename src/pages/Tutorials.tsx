import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { tutorialModules, type TutorialModule, type Tutorial } from '@/components/tutorials/TutorialData';
import { cn } from '@/lib/utils';

export default function Tutorials() {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const filteredModules = tutorialModules.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tutorials.some(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
      )
    );
  });

  const activeModule = selectedModule ? tutorialModules.find(m => m.id === selectedModule) : null;

  const toggleStep = (stepKey: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepKey)) next.delete(stepKey);
      else next.add(stepKey);
      return next;
    });
  };

  const totalSteps = selectedTutorial?.steps.length || 0;
  const doneSteps = selectedTutorial?.steps.filter((_, i) => completedSteps.has(`${selectedTutorial.id}-${i}`)).length || 0;

  if (selectedTutorial && activeModule) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => { setSelectedTutorial(null); setSelectedModule(null); }} className="hover:text-foreground transition-colors">Tutoriales</button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={() => setSelectedTutorial(null)} className="hover:text-foreground transition-colors">{activeModule.title}</button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{selectedTutorial.title}</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{selectedTutorial.title}</h1>
          <p className="text-muted-foreground">{selectedTutorial.description}</p>
        </div>

        {totalSteps > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(doneSteps / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground font-medium">{doneSteps}/{totalSteps}</span>
          </div>
        )}

        <div className="space-y-3">
          {selectedTutorial.steps.map((step, i) => {
            const key = `${selectedTutorial.id}-${i}`;
            const done = completedSteps.has(key);
            return (
              <Card
                key={i}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md',
                  done && 'border-primary/30 bg-primary/5'
                )}
                onClick={() => toggleStep(key)}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full shrink-0 text-sm font-bold transition-colors',
                    done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-semibold text-sm', done && 'line-through text-muted-foreground')}>{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeModule) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => setSelectedModule(null)} className="hover:text-foreground transition-colors">Tutoriales</button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{activeModule.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <activeModule.icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{activeModule.title}</h1>
            <p className="text-muted-foreground">{activeModule.description}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {activeModule.tutorials.map(t => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
              onClick={() => setSelectedTutorial(t)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                <Badge variant="secondary">{t.steps.length} pasos</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Tutoriales
          </h1>
          <p className="text-muted-foreground">Guías paso a paso para utilizar cada módulo del sistema.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tutorial..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map(mod => (
          <Card
            key={mod.id}
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30 group"
            onClick={() => setSelectedModule(mod.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{mod.description}</p>
              <Badge variant="outline">{mod.tutorials.length} tutorial{mod.tutorials.length > 1 ? 'es' : ''}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron tutoriales que coincidan con "{search}".
        </div>
      )}
    </div>
  );
}
