import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Layers, Link, ChevronDown, Plus, X } from "lucide-react";
import { Handle, Position } from 'reactflow';

export interface AdditionalInfo {
  text: string;
  tags: string[];
}

interface ActivityNodeProps {
  id: string;
  data: {
    verbPhrase: string;
    additionalInfo: AdditionalInfo[];
    drilldownFlowId?: string;
    links?: { name: string; url: string }[];
  };
  onChange: (newText: string, newAdditionalInfo: AdditionalInfo[]) => void;
  onOpenDrilldown: (flowId: string) => void;
  onAddDrilldown: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

// タグの型を定義
type TagType = 'R' | 'A' | 'C' | 'I';

// tagColorsオブジェクトの型を明示的に定義
const tagColors: Record<TagType, string> = {
  R: 'bg-pink-200 text-pink-800',
  A: 'bg-green-200 text-green-800',
  C: 'bg-yellow-200 text-yellow-800',
  I: 'bg-blue-200 text-blue-800',
};

const handleStyle = {
  width: '18px',  // 12px * 1.5
  height: '18px', // 12px * 1.5
  background: '#ddd',
  border: '1px solid #ddd', // 枠線の色を中と同じに
  borderRadius: '50%',
};

const ActivityNode: React.FC<ActivityNodeProps> = ({ 
  id, 
  data, 
  onChange, 
  onOpenDrilldown, 
  onAddDrilldown,
  onContextMenu
}) => {
  const [isEditing, setIsEditing] = useState(data.verbPhrase === '');
  const [text, setText] = useState(data.verbPhrase);
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo[]>(data.additionalInfo || []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const additionalInfoRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(text, additionalInfo);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setIsEditing(false);
      setFocusedIndex(null);
      setEditingTagIndex(null);
      onChange(text, additionalInfo);
    }
  };

  const handleAdditionalInfoChange = (index: number, value: string) => {
    const newAdditionalInfo = [...additionalInfo];
    newAdditionalInfo[index] = { ...newAdditionalInfo[index], text: value };
    setAdditionalInfo(newAdditionalInfo);
    onChange(text, newAdditionalInfo);
  };

  const handleAdditionalInfoFocus = (index: number) => {
    setFocusedIndex(index);
    setEditingTagIndex(index);
  };

  const handleAdditionalInfoBlur = () => {
    setFocusedIndex(null);
    // タグ編集中はフォーカスを外さない
    if (editingTagIndex === null) {
      setEditingTagIndex(null);
    }
  };

  const addAdditionalInfo = () => {
    if (additionalInfo.length < 4) {
      const newIndex = additionalInfo.length;
      setAdditionalInfo([...additionalInfo, { text: '', tags: [] }]);
      setFocusedIndex(newIndex);
      setEditingTagIndex(newIndex);
      // 次のレンダリングサイクルで新しい要素にフォーカスを当てる
      setTimeout(() => {
        additionalInfoRefs.current[newIndex]?.focus();
      }, 0);
    }
  };

  const removeAdditionalInfo = (index: number) => {
    const newAdditionalInfo = additionalInfo.filter((_, i) => i !== index);
    setAdditionalInfo(newAdditionalInfo);
    onChange(text, newAdditionalInfo);
  };

  const toggleTag = (index: number, tag: TagType) => {
    const newAdditionalInfo = [...additionalInfo];
    const currentTags = newAdditionalInfo[index].tags;
    if (currentTags.includes(tag)) {
      newAdditionalInfo[index].tags = currentTags.filter(t => t !== tag);
    } else {
      newAdditionalInfo[index].tags = [...currentTags, tag];
    }
    setAdditionalInfo(newAdditionalInfo);
    onChange(text, newAdditionalInfo);
  };

  const handleTagClick = (index: number) => {
    setEditingTagIndex(index);
  };

  // タグ編集モードを終了する関数
  const finishTagEditing = () => {
    setEditingTagIndex(null);
  };

  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.additional-info-item, .activity-text') === null) {
      setFocusedIndex(null);
      setEditingTagIndex(null);
      setIsEditing(false);
      onChange(text, additionalInfo);
    }
  };

  const handleActivityTextClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
    setFocusedIndex(null);
    setEditingTagIndex(null);
    onChange(text, additionalInfo);
  };

  const handleDrilldownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.drilldownFlowId) {
      onOpenDrilldown(data.drilldownFlowId);
    } else {
      onAddDrilldown();
    }
  };

  return (
    <div 
      className="relative w-[300px] bg-white rounded-lg shadow-lg border-4 border-blue-500 overflow-visible text-center"
      onClick={handleOutsideClick}
      onContextMenu={onContextMenu}
    >
      {/* ドリルダウンリンクマーク */}
      {data.drilldownFlowId && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 p-0"
          onClick={handleDrilldownClick}
        >
          <Layers className="h-4 w-4" />
        </Button>
      )}

      {/* 上部のハンドル */}
      <Handle 
        type="source" 
        position={Position.Top} 
        id="t1" 
        style={{...handleStyle, top: '-23px', left: 'calc(33% - 9px)'}} 
        data-handleid="t1"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="t1" 
        style={{...handleStyle, top: '-23px', left: 'calc(33% - 9px)'}} 
        data-handleid="t1"
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        id="t2" 
        style={{...handleStyle, top: '-23px', left: 'calc(67% - 9px)'}} 
        data-handleid="t2"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="t2" 
        style={{...handleStyle, top: '-23px', left: 'calc(67% - 9px)'}} 
        data-handleid="t2"
      />

      {/* 右側のハンドル */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="r1" 
        style={{...handleStyle, right: '-23px', top: 'calc(33% - 9px)'}} 
        data-handleid="r1"
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="r1" 
        style={{...handleStyle, right: '-23px', top: 'calc(33% - 9px)'}} 
        data-handleid="r1"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="r2" 
        style={{...handleStyle, right: '-23px', top: 'calc(67% - 9px)'}} 
        data-handleid="r2"
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="r2" 
        style={{...handleStyle, right: '-23px', top: 'calc(67% - 9px)'}} 
        data-handleid="r2"
      />

      {/* 下部のハンドル */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="b1" 
        style={{...handleStyle, bottom: '-23px', left: 'calc(33% - 9px)'}} 
        data-handleid="b1"
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="b1" 
        style={{...handleStyle, bottom: '-23px', left: 'calc(33% - 9px)'}} 
        data-handleid="b1"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="b2" 
        style={{...handleStyle, bottom: '-23px', left: 'calc(67% - 9px)'}} 
        data-handleid="b2"
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="b2" 
        style={{...handleStyle, bottom: '-23px', left: 'calc(67% - 9px)'}} 
        data-handleid="b2"
      />

      {/* 左側のハンドル */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id="l1" 
        style={{...handleStyle, left: '-23px', top: 'calc(33% - 9px)'}} 
        data-handleid="l1"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="l1" 
        style={{...handleStyle, left: '-23px', top: 'calc(33% - 9px)'}} 
        data-handleid="l1"
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="l2" 
        style={{...handleStyle, left: '-23px', top: 'calc(67% - 9px)'}} 
        data-handleid="l2"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="l2" 
        style={{...handleStyle, left: '-23px', top: 'calc(67% - 9px)'}} 
        data-handleid="l2"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 z-10" aria-label="Open menu">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px]">
          {data.links && data.links.length > 0 ? (
            <div className="grid gap-4">
              {data.links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {link.name}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-gray-500">
              関連情報はありません
            </div>
          )}
        </PopoverContent>
      </Popover>
      <div className="flex flex-col items-center justify-center px-4 py-3 border-b border-gray-200 h-48 activity-text">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="text-xl font-bold text-center w-full h-full focus:outline-none"
            placeholder="アクティビティを入力"
          />
        ) : (
          <h2 
            className="text-xl font-bold cursor-pointer h-full flex items-center justify-center" 
            onClick={handleActivityTextClick}
          >
            {text || 'アクティビティを入力'}
          </h2>
        )}
      </div>
      <div className="p-0">
        {additionalInfo.map((info, index) => (
          <div key={index} className="additional-info-item border-b border-gray-200 last:border-b-0">
            {focusedIndex === index || editingTagIndex === index ? (
              // 編集モード
              <div className="flex items-center justify-center px-1 py-1 h-12" onKeyDown={handleKeyDown}>
                <div className="flex items-center justify-center w-full">
                  <div className="flex space-x-0.5 mr-1">
                    {['R', 'A', 'C', 'I'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(index, tag as TagType)}
                        className={`w-6 h-6 rounded-full ${info.tags.includes(tag) ? tagColors[tag as TagType] : 'bg-gray-200'} text-sm font-bold`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    ref={(el) => {
                      additionalInfoRefs.current[index] = el;
                    }}
                    type="text"
                    value={info.text}
                    onChange={(e) => handleAdditionalInfoChange(index, e.target.value)}
                    onFocus={() => handleAdditionalInfoFocus(index)}
                    onBlur={handleAdditionalInfoBlur}
                    className="w-[100px] px-1 py-0.5 mx-1 h-full overflow-y-auto focus:outline-none text-left text-base"
                  />
                  <Button 
                    onClick={() => removeAdditionalInfo(index)} 
                    className="p-0.5 h-6 w-6 rounded-full bg-white hover:bg-gray-100 flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-black" />
                  </Button>
                </div>
              </div>
            ) : (
              // 表示モード
              <div 
                className="flex items-center justify-center px-1 py-1 h-12 cursor-text"
                onClick={(e) => {
                //   e.stopPropagation();
                  handleAdditionalInfoFocus(index);
                }}
              >
                <div className="flex space-x-0.5 mr-1 flex-shrink-0">
                  {info.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`w-6 h-6 rounded-full ${tagColors[tag as TagType]} text-sm font-bold flex items-center justify-center`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-base">{info.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {additionalInfo.length < 4 && (
        <div className="px-4 py-2">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              addAdditionalInfo();
            }} 
            className="h-5 w-5 rounded-full p-0 bg-white hover:bg-gray-100"
          >
            <Plus className="h-3 w-3 text-black" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityNode;