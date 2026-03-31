const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/Modernizacion/Documents/logistica-inteligente-refactor/frontend/src/components/ui';

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.jsx')) {
            fixFile(filePath);
        }
    });
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix the broken React import
    content = content.replace(/^import \*\s*\n/gm, "import * as React from 'react'\n");
    content = content.replace(/^import \* as React from 'react'\s*\nimport \*\s*\n/gm, "import * as React from 'react'\nimport * as ");

    // Specific fixes for common radix imports if they were broken
    content = content.replace(/import \*@radix-ui\/react-toast'/g, "import * as ToastPrimitives from '@radix-ui/react-toast'");
    content = content.replace(/import \*@radix-ui\/react-label'/g, "import * as LabelPrimitive from '@radix-ui/react-label'");
    content = content.replace(/import \*@radix-ui\/react-slot'/g, "import * as SlotPrimitive from '@radix-ui/react-slot'");
    content = content.replace(/import \*@radix-ui\/react-dialog'/g, "import * as DialogPrimitive from '@radix-ui/react-dialog'");
    content = content.replace(/import \*@radix-ui\/react-separator'/g, "import * as SeparatorPrimitive from '@radix-ui/react-separator'");
    content = content.replace(/import \*@radix-ui\/react-popover'/g, "import * as PopoverPrimitive from '@radix-ui/react-popover'");
    content = content.replace(/import \*@radix-ui\/react-select'/g, "import * as SelectPrimitive from '@radix-ui/react-select'");
    content = content.replace(/import \*@radix-ui\/react-tabs'/g, "import * as TabsPrimitive from '@radix-ui/react-tabs'");
    content = content.replace(/import \*@radix-ui\/react-checkbox'/g, "import * as CheckboxPrimitive from '@radix-ui/react-checkbox'");
    content = content.replace(/import \*@radix-ui\/react-dropdown-menu'/g, "import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'");
    content = content.replace(/import \*@radix-ui\/react-accordion'/g, "import * as AccordionPrimitive from '@radix-ui/react-accordion'");
    content = content.replace(/import \*@radix-ui\/react-alert-dialog'/g, "import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'");
    content = content.replace(/import \*@radix-ui\/react-aspect-ratio'/g, "import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'");
    content = content.replace(/import \*@radix-ui\/react-avatar'/g, "import * as AvatarPrimitive from '@radix-ui/react-avatar'");
    content = content.replace(/import \*@radix-ui\/react-collapsible'/g, "import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'");
    content = content.replace(/import \*@radix-ui\/react-context-menu'/g, "import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'");
    content = content.replace(/import \*@radix-ui\/react-menubar'/g, "import * as MenubarPrimitive from '@radix-ui/react-menubar'");
    content = content.replace(/import \*@radix-ui\/react-navigation-menu'/g, "import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'");
    content = content.replace(/import \*@radix-ui\/react-progress'/g, "import * as ProgressPrimitive from '@radix-ui/react-progress'");
    content = content.replace(/import \*@radix-ui\/react-radio-group'/g, "import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'");
    content = content.replace(/import \*@radix-ui\/react-scroll-area'/g, "import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'");
    content = content.replace(/import \*@radix-ui\/react-slider'/g, "import * as SliderPrimitive from '@radix-ui/react-slider'");
    content = content.replace(/import \*@radix-ui\/react-switch'/g, "import * as SwitchPrimitive from '@radix-ui/react-switch'");
    content = content.replace(/import \*@radix-ui\/react-toggle'/g, "import * as TogglePrimitive from '@radix-ui/react-toggle'");
    content = content.replace(/import \*@radix-ui\/react-toggle-group'/g, "import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'");
    content = content.replace(/import \*@radix-ui\/react-tooltip'/g, "import * as TooltipPrimitive from '@radix-ui/react-tooltip'");

    // General fix for any "import *@" leftovers
    content = content.replace(/import \*@/g, "import * as Primitive from '@");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
}

walk(directory);
console.log("Fix finished.");
