import { FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative border-t border-surface-border bg-surface-50/30">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-surface/50 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-cyan-dim border border-accent-cyan/20 
                              flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-accent-cyan" />
              </div>
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase text-text-secondary">
                Food × Drug
              </span>
            </div>
            <p className="text-[13px] text-text-tertiary leading-relaxed">
              Precision intelligence for food and drug molecular interactions.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-mono text-[10px] font-semibold tracking-[0.15em] uppercase text-text-secondary mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {['Analyze Interaction', 'Research Pairings', 'Data Sources', 'Methodology'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Science */}
          <div>
            <h4 className="font-mono text-[10px] font-semibold tracking-[0.15em] uppercase text-text-secondary mb-4">
              Science
            </h4>
            <ul className="space-y-2.5">
              {['CYP450 Enzymes', 'Molecular Visualization', 'SHAP Explainability', 'ML Architecture'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-mono text-[10px] font-semibold tracking-[0.15em] uppercase text-text-secondary mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {['Documentation', 'API Reference', 'GitHub', 'License'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="thin-separator mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-mono text-text-muted tracking-wider">
            © 2026 Food × Drug Molecular Intelligence. Research and educational purposes only.
          </p>
          <p className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
            Not a substitute for professional medical advice
          </p>
        </div>
      </div>
    </footer>
  );
}
