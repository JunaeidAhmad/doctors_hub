import React from 'react';
import { 
  Stethoscope, Heart, Brain, Eye, Activity, Baby, Users, Layers 
} from 'lucide-react';

export const ICON_OPTIONS = [
  'Stethoscope', 'Heart', 'Brain', 'Eye', 'Activity', 'Baby', 'Users', 'Layers'
];

export function renderTaxonomyIcon(iconName, className = "w-4 h-4") {
  switch (iconName) {
    case 'Heart': return <Heart className={className} />;
    case 'Brain': return <Brain className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Baby': return <Baby className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Layers': return <Layers className={className} />;
    default: return <Stethoscope className={className} />;
  }
}
