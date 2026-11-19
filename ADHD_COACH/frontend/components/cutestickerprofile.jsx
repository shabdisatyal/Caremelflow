import { useState } from "react";

import { profileIcons } from "./avatar";



export function Stickers({selected, onSelect}) {


    return (
        <div className="bg-[bgcolor] grid grid-cols-4 gap-3 mt-2 p-4 max-w-md mx-auto">
         {
            profileIcons.map(
                (icon)=> (
                    <button
                        key={icon.id}
                        onClick={() => onSelect(icon.id)}
                        className={
                            selected === icon.id
                            ? "aspect-square overflow-hidden rounded-xl bg-amber-100 border-4 border-amber-200 p-2"
                            : "aspect-square overflow-hidden rounded-xl bg-amber-100 border-4 border-none p-2"
                        }
                        >
                             <img src ={icon.icon} className="w-full h-full object-cover"/> 
                        
                        </button>
                )
            )
         }

        </div>



    )
}